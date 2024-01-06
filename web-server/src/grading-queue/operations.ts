import { randomUUID } from "crypto";
import { RedisTransactionBuilder } from "./transactions";
import {
  Collation,
  DeleteJobRequest,
  GradingJob,
  GradingJobConfig,
  MoveJobRequest,
} from "./types";
import {
  collationToString,
  generateQueueKey,
  isNumberArray,
  toMilliseconds,
} from "./utils";
import Redis from "ioredis";
import { reduceRight, toInteger } from "lodash";
import { GradingQueueOperationError } from "./exceptions";
import { GraderImageBuildRequest } from "../grader-images/types";

const MOVE_TO_BACK_BUFFER = toMilliseconds(10);

// TODO: For more efficient pagination, investigate passing in the pagination range to account
// for zrange bounds
const getAllGradingJobs = async (
  redisConnection: Redis,
): Promise<GradingJob[]> => {
  const reservations: Array<ZRangeItemWithScore> = zrangeToItems(
    await redisConnection.zrange("Reservations", 0, -1, "WITHSCORES"),
  );
  if (reservations.length === 0) return [];
  const submitterInfoCache: Record<string, Array<string>> = {};
  return await Promise.all(
    reservations.map(async (reservation) => {
      const { member } = reservation;
      const reservationMemberSections = member.split(".");
      if (reservationMemberSections.length === 2) {
        return await getImmediateJobFromReservation(
          redisConnection,
          reservationMemberSections as [string, string],
        );
      } else if (reservationMemberSections.length === 3) {
        return await getJobFromReservation(
          redisConnection,
          reservationMemberSections as [string, string, string],
          submitterInfoCache,
        );
      } else {
        throw new GradingQueueOperationError(
          `Invalid reservation member ${reservation.member}`,
        );
      }
    }),
  );
};

const createHoldingPenKey = async (
  transactionBuilder: RedisTransactionBuilder,
  { dockerfileSHASum }: GraderImageBuildRequest,
): Promise<RedisTransactionBuilder> => {
  return transactionBuilder.SET(dockerfileSHASum, dockerfileSHASum);
};

const deleteHoldingPenKey = async (
  transactionBuilder: RedisTransactionBuilder,
  { dockerfileSHASum }: GraderImageBuildRequest,
) => {
  return transactionBuilder.DEL(dockerfileSHASum);
};

interface HoldingPenJobs {
  regularJobs: Array<GradingJobConfig>;
  immediateJobs: Array<GradingJobConfig>;
}

const clearHoldingPen = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  { dockerfileSHASum }: GraderImageBuildRequest,
): Promise<[RedisTransactionBuilder, HoldingPenJobs]> => {
  const [jobPenKey, immediateJobPenKey] = [
    `Jobs.${dockerfileSHASum}`,
    `ImmediateJobs.${dockerfileSHASum}`,
  ];
  const regularJobs = (await redisConnection.lrange(jobPenKey, 0, -1)).map(
    (jobConfigString) => JSON.parse(jobConfigString) as GradingJobConfig,
  );
  const immediateJobs = (
    await redisConnection.lrange(immediateJobPenKey, 0, -1)
  ).map((jobConfigString) => JSON.parse(jobConfigString) as GradingJobConfig);
  return [transactionBuilder, { regularJobs, immediateJobs }];
};

const releaseAllJobsFromHoldingPen = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  graderImageBuildReq: GraderImageBuildRequest,
): Promise<RedisTransactionBuilder> => {
  const [jobPenKey, immediateJobPenKey] = [
    `Jobs.${graderImageBuildReq.dockerfileSHASum}`,
    `ImmediateJobs.${graderImageBuildReq.dockerfileSHASum}`,
  ];
  await releaseJobsFromHoldingPen(
    redisConnection,
    transactionBuilder,
    jobPenKey,
    false,
  );
  await releaseJobsFromHoldingPen(
    redisConnection,
    transactionBuilder,
    immediateJobPenKey,
    true,
  );
  return deleteHoldingPenKey(transactionBuilder, graderImageBuildReq);
};

const releaseJobsFromHoldingPen = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  jobPenKey: string,
  areImmediateJobs: boolean,
): Promise<RedisTransactionBuilder> => {
  const jobConfigs: Array<GradingJobConfig> = (
    await redisConnection.lrange(jobPenKey, 0, -1)
  ).map((configString) => JSON.parse(configString) as GradingJobConfig);
  await Promise.all(
    jobConfigs.map((jobConfig) =>
      createOrUpdateJob(
        redisConnection,
        transactionBuilder,
        jobConfig,
        generateQueueKey(jobConfig.key, jobConfig.response_url),
        Date.now(),
        areImmediateJobs,
      ),
    ),
  );
  return transactionBuilder;
};

const graderImageBuildInProgress = async (
  redisConnection: Redis,
  { grader_image_sha }: GradingJobConfig,
): Promise<boolean> => {
  return Boolean(await redisConnection.exists(grader_image_sha));
};

const createOrUpdateJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  orcaKey: string,
  arrivalTime: number,
  isImmediateJob: boolean,
): Promise<RedisTransactionBuilder> => {
  const keyMatchesRegularJob = await nonImmediateJobExists(
    redisConnection,
    orcaKey,
    jobConfig.collation,
  );
  const keyMatchesImmediateJob = await immediateJobExists(
    redisConnection,
    orcaKey,
  );
  if (!keyMatchesRegularJob && !keyMatchesImmediateJob) {
    enqueueJob(
      transactionBuilder,
      jobConfig,
      arrivalTime,
      orcaKey,
      isImmediateJob,
    );
  } else if (keyMatchesImmediateJob && isImmediateJob) {
    deleteNonImmediateJob(
      redisConnection,
      transactionBuilder,
      orcaKey,
      jobConfig.collation,
    );
    enqueueJob(
      transactionBuilder,
      jobConfig,
      arrivalTime,
      orcaKey,
      isImmediateJob,
    );
  } else {
    await updateJob(redisConnection, transactionBuilder, jobConfig, orcaKey);
  }
  return transactionBuilder;
};

const placeJobInHoldingPen = async (
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  isImmediateJob: boolean,
): Promise<RedisTransactionBuilder> => {
  const jobConfigString = JSON.stringify(jobConfig);
  return isImmediateJob
    ? transactionBuilder.RPUSH(
        `ImmediateJobs.${jobConfig.grader_image_sha}`,
        jobConfigString,
      )
    : transactionBuilder.RPUSH(
        `Jobs.${jobConfig.grader_image_sha}`,
        jobConfigString,
      );
};

const deleteJob = async (
  transactionBuilder: RedisTransactionBuilder,
  { orcaKey, nonce, collation }: DeleteJobRequest,
): Promise<RedisTransactionBuilder> => {
  let reservationMember: string;
  if (collation && nonce) {
    const collationString = collationToString(collation);
    const submitterInfoKey = `SubmitterInfo.${collationString}`;
    reservationMember = `${collationString}.${nonce}`;
    transactionBuilder
      .SREM(`Nonces.${collationString}`, nonce.toString())
      .LREM(submitterInfoKey, orcaKey)
      .ZREM("Reservations", reservationMember)
      .DEL(orcaKey);
  } else {
    reservationMember = `immediate.${orcaKey}`;
    transactionBuilder.ZREM("Reservations", reservationMember).DEL(orcaKey);
  }
  return transactionBuilder;
};

const moveJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  moveRequest: MoveJobRequest,
): Promise<RedisTransactionBuilder> => {
  const { moveAction, orcaKey } = moveRequest;
  switch (moveAction) {
    case "release":
      const currentJob = await redisConnection.get(orcaKey);
      if (!currentJob) {
        throw new GradingQueueOperationError(
          `Attempted to move a job under key ${orcaKey} that does not exist.`,
        );
      }
      const { created_at, release_at, orca_key, nonce, ...jobConfig } =
        JSON.parse(currentJob) as GradingJob;
      return await createOrUpdateJob(
        redisConnection,
        transactionBuilder,
        jobConfig,
        orcaKey,
        created_at,
        true,
      );
      break;
    case "delay":
      return await delayJob(redisConnection, transactionBuilder, moveRequest);
      break;
    default:
      throw new TypeError(
        `Invalid action "${moveAction}" provided in move request.`,
      );
  }
};

const delayJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  { collation, orcaKey, nonce }: MoveJobRequest,
): Promise<RedisTransactionBuilder> => {
  const reservationsZRange = zrangeToItems(
    await redisConnection.zrange("Reservations", -1, -1, "WITHSCORES"),
  );
  const lastJobPriority = reservationsZRange[0].score;
  const newPriority = lastJobPriority + MOVE_TO_BACK_BUFFER;
  const submitterInfoKey = `SubmitterInfo.${collationToString(collation)}`;
  const reservationMember = `${collationToString(collation)}.${nonce}`;
  return transactionBuilder
    .ZADD("Reservations", reservationMember, newPriority)
    .LREM(submitterInfoKey, orcaKey)
    .RPUSH(submitterInfoKey, orcaKey);
};

const updateJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  orcaKey: string,
): Promise<RedisTransactionBuilder> => {
  const originalJob: GradingJob = JSON.parse(
    (await redisConnection.get(orcaKey)) as string,
  );
  const updatedJob: GradingJob = {
    ...originalJob,
    ...jobConfig,
  };
  return transactionBuilder.SET(orcaKey, JSON.stringify(updatedJob));
};

const enqueueJob = (
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  arrivalTime: number,
  orcaKey: string,
  isImmediateJob: boolean,
): RedisTransactionBuilder => {
  return isImmediateJob
    ? createImmediateJob(transactionBuilder, jobConfig, arrivalTime, orcaKey)
    : createJob(transactionBuilder, jobConfig, arrivalTime, orcaKey);
};

const createImmediateJob = (
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  arrivalTime: number,
  orcaKey: string,
): RedisTransactionBuilder => {
  const gradingJob: GradingJob = {
    ...jobConfig,
    created_at: arrivalTime,
    release_at: arrivalTime,
    orca_key: orcaKey,
  };

  return transactionBuilder
    .ZADD("Reservations", `immediate.${orcaKey}`, arrivalTime)
    .SET(orcaKey, JSON.stringify(gradingJob));
};

const createJob = (
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  arrivalTime: number,
  orcaKey: string,
): RedisTransactionBuilder => {
  const { priority, collation } = jobConfig;
  const releaseTime = arrivalTime + priority;
  const nextTask = collationToString(collation);
  const gradingJob: GradingJob = {
    ...jobConfig,
    created_at: arrivalTime,
    release_at: releaseTime,
    orca_key: orcaKey,
  };
  const nonce = randomUUID();
  return transactionBuilder
    .LPUSH(`SubmitterInfo.${nextTask}`, orcaKey)
    .ZADD("Reservations", `${nextTask}.${nonce}`, releaseTime)
    .SADD(`Nonces.${nextTask}`, nonce)
    .SET(orcaKey, JSON.stringify(gradingJob));
};

const deleteNonImmediateJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  orcaKey: string,
  collation: Collation,
): Promise<RedisTransactionBuilder> => {
  const nonceToDelete = await getNonceToDelete(redisConnection, collation);
  const collationString = collationToString(collation);
  return transactionBuilder
    .SREM(`Nonces.${collationToString}`, nonceToDelete)
    .ZREM("Reservations", `${collationString}.${nonceToDelete}`)
    .LREM(`SubmitterInfo.${collationString}`, orcaKey)
    .DEL(orcaKey);
};

const getImmediateJobFromReservation = async (
  redisConnection: Redis,
  [_immediateLiteral, orcaKey]: [string, string],
): Promise<GradingJob> => {
  const enqueuedJobString = await redisConnection.get(orcaKey);
  if (!enqueuedJobString) {
    throw new GradingQueueOperationError(
      `No job was found with key ${orcaKey}.`,
    );
  }
  return JSON.parse(enqueuedJobString) as GradingJob;
};

const getJobFromReservation = async (
  redisConnection: Redis,
  reservationMemberSections: [string, string, string],
  submitterInfoCache: Record<string, Array<string>>,
): Promise<GradingJob> => {
  const collationString = reservationMemberSections
    .slice(0, reservationMemberSections.length - 1)
    .join(".");
  const submitterInfoKey = `SubmitterInfo.${collationString}`;
  if (!submitterInfoCache[submitterInfoKey]) {
    const orcaKeys = await redisConnection.lrange(submitterInfoKey, 0, -1);
    submitterInfoCache[submitterInfoKey] = orcaKeys;
  }
  const orcaKey = submitterInfoCache[submitterInfoKey].shift();
  if (!orcaKey) {
    throw new GradingQueueOperationError(
      `No job key to match reservation member ${reservationMemberSections.join(
        ".",
      )}.`,
    );
  }
  const enqueuedJobString = await redisConnection.get(orcaKey);
  if (!enqueuedJobString) {
    throw new GradingQueueOperationError(
      `No job was found with key ${orcaKey}.`,
    );
  }
  return JSON.parse(enqueuedJobString) as GradingJob;
};

const getNonceToDelete = async (
  redisConnection: Redis,
  collation: Collation,
): Promise<string> => {
  const collationString = collationToString(collation);
  const nonces: string[] = await redisConnection.smembers(
    `Nonces.${collationString}`,
  );
  const reservationScores = (
    await redisConnection.zmscore(
      "Reservations",
      nonces.map((n) => `${n}.${collationString}`),
    )
  ).map((v) => toInteger(v));
  if (!isNumberArray(reservationScores)) {
    throw new GradingQueueOperationError(
      `The number of nonces is not equal to the number of reservations for collation ${collationString}`,
    );
  }
  const scoreToIndex: Record<number, number> = reservationScores.reduce(
    (prev, curr, i) => (prev[curr] = i),
    {},
  );
  return nonces[scoreToIndex[reservationScores.sort()[0]]];
};

const nonImmediateJobExists = async (
  redisConnection: Redis,
  orcaKey: string,
  collation: Collation,
): Promise<boolean> => {
  return (
    (await redisConnection.lpos(
      `SubmitterInfo.${collationToString(collation)}`,
      orcaKey,
    )) !== null
  );
};

const immediateJobExists = async (redisConnection: Redis, orcaKey: string) => {
  return (
    (await redisConnection.zscore("Reservations", `immediate.${orcaKey}`)) !==
    null
  );
};

interface ZRangeItemWithScore {
  member: string;
  score: number;
}

const zrangeToItems = (zrangeRawOutput: string[]) => {
  if (zrangeRawOutput.length % 2 !== 0) {
    throw new GradingQueueOperationError(
      "ZRANGE output does not contain members and scores.",
    );
  }
  const itemArray: Array<ZRangeItemWithScore> = [];
  for (let i = 0; i < zrangeRawOutput.length; i += 2) {
    itemArray.push({
      member: zrangeRawOutput[i],
      score: toInteger(zrangeRawOutput[i + 1]),
    });
  }
  return itemArray;
};

export default {
  getAllGradingJobs,
  createOrUpdateJob,
  deleteJob,
  moveJob,
  createHoldingPenKey,
  deleteHoldingPenKey,
  clearHoldingPen,
  releaseAllJobsFromHoldingPen,
  graderImageBuildInProgress,
  placeJobInHoldingPen,
};
