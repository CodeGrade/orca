import Redis from "ioredis";
import { randomUUID } from "crypto";
import { RedisTransactionBuilder } from "../redis";
import { Collation, GradingJob, GradingJobConfig } from "../types";
import { collationToString } from "../grading-jobs";
import { isNumber, toInteger } from "lodash";
import { GradingQueueOperationError } from "./exceptions";

export const createOrUpdateJobTransaction = async (
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
  } else if (keyMatchesRegularJob && isImmediateJob) {
    await deleteNonImmediateJob(
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
  const collationString = collationToString(collation);
  const gradingJob: GradingJob = {
    ...jobConfig,
    created_at: arrivalTime,
    release_at: releaseTime,
    orca_key: orcaKey,
  };
  const nonce = randomUUID();
  return transactionBuilder
    .LPUSH(`SubmitterInfo.${collationString}`, orcaKey)
    .ZADD("Reservations", `${collationString}.${nonce}`, releaseTime)
    .SADD(`Nonces.${collationString}`, nonce)
    .SET(orcaKey, JSON.stringify(gradingJob));
};

const deleteNonImmediateJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  orcaKey: string,
  collation: Collation,
): Promise<RedisTransactionBuilder> => {
  const nonceToDelete = await getNonceToDelete(redisConnection, collation);
  console.log(nonceToDelete);
  const collationString = collationToString(collation);
  console.log(`Nonces.${collationToString}`);
  console.log(collationString);
  return transactionBuilder
    .SREM(`Nonces.${collationToString}`, nonceToDelete)
    .ZREM("Reservations", `${collationString}.${nonceToDelete}`)
    .LREM(`SubmitterInfo.${collationString}`, orcaKey)
    .DEL(orcaKey);
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
      nonces.map((n) => `${collationString}.${n}`),
    )
  ).map((v) => toInteger(v));
  if (!isNumberArray(reservationScores)) {
    throw new GradingQueueOperationError(
      `The number of nonces is not equal to the number of reservations for collation ${collationString}`,
    );
  }
  const scoreToIndex: Record<number, number> = reservationScores.reduce(
    (prev, curr, i) => {
      prev[curr] = i;
      return prev;
    },
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

const isNumberArray = (array: unknown[]): array is Array<number> => {
  return array.every((item) => isNumber(item));
};
