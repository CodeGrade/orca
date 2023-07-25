import { RedisClientType } from "redis";
import { GradingJob, EnrichedGradingJob } from "./types";
import { createQueueKey, generateNonce } from "./utils";

export const createOrUpdateGradingJob = async (
  client: RedisClientType,
  job: GradingJob,
  isImmediateJob: boolean = false,
) => {
  const queueKey = createQueueKey(job.key, job.response_url);
  const jobExists = await client.EXISTS(queueKey);
  if (jobExists) {
    const existingJob = JSON.parse(
      (await client.GET(job.key)) as string,
    ) as EnrichedGradingJob;
    client.SET(
      queueKey,
      JSON.stringify({
        ...job,
        created_at: existingJob.created_at,
        release_at: existingJob.release_at,
      }),
    );
  } else {
    const arrivalTime = Date.now();
    const releaseTime = arrivalTime + job.priority;
    await enqueueJob(client, job, arrivalTime, queueKey, isImmediateJob);
    await client.SET(
      job.key,
      JSON.stringify({
        ...job,
        created_at: arrivalTime,
        release_at: releaseTime,
      }),
    );
  }
};

const enqueueJob = async (
  client: RedisClientType,
  job: GradingJob,
  arrivalTime: number,
  orcaKey: string,
  isImmediateJob: boolean,
) => {
  if (isImmediateJob) {
    await createImmediateJob(client, job, arrivalTime, orcaKey);
  } else {
    await createJob(client, job, arrivalTime, orcaKey);
  }
};

const createJob = async (
  client: RedisClientType,
  gradingJob: GradingJob,
  arrivalTime: number,
  orcaKey: string,
): Promise<void> => {
  const { priority, collation } = gradingJob;
  const releaseTime = arrivalTime + priority;
  const enrichedJob: EnrichedGradingJob = {
    ...gradingJob,
    created_at: arrivalTime,
    release_at: releaseTime,
    orca_key: orcaKey,
  };

  const nextTask = `${collation.type}.${collation.id}`;

  // Create reservation
  const nonce = generateNonce(client, enrichedJob, arrivalTime);
  await client.ZADD("Reservations", {
    score: releaseTime,
    value: `${nextTask}.${nonce}`,
  });

  // Push key to SubmitterInfo list
  await client.LPUSH(`SubmitterInfo.${nextTask}`, orcaKey);

  // Store nonce
  client.SADD(`Nonces.${nextTask}`, nonce.toString());
};

const createImmediateJob = async (
  client: RedisClientType,
  gradingJob: GradingJob,
  arrivalTime: number,
  orcaKey: string,
): Promise<void> => {
  const enrichedGradingJob: EnrichedGradingJob = {
    ...gradingJob,
    created_at: arrivalTime,
    release_at: arrivalTime,
    orca_key: orcaKey,
  };

  // Create reservation
  const nonce = generateNonce(client, enrichedGradingJob, arrivalTime);
  await client.ZADD("Reservations", {
    score: arrivalTime,
    value: `immediate.${orcaKey}.${nonce}`,
  });
};
