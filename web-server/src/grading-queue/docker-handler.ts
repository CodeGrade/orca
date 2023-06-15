import {
  redisExists,
  redisLPop,
  redisLRem,
  redisRPush,
  withLock,
} from "../utils/redis";
import createJob from "./create";
import createImmediateJob from "./create-immediate";
import { GradingJob } from "./types";

export const doesContainerSHAKeyExist = async (containerSHA: string) => {
  const [exists, error] = await redisExists(containerSHA);
  if (error) {
    throw error;
  }
  return exists! > 0;
};

export const addJobToDockerQueue = async (
  job: GradingJob,
  immediateJob: boolean,
) => {
  await withLock(async () => {
    let _, error;
    if (immediateJob) {
      [_, error] = await redisRPush(
        `${job.container_sha}.ImmediateJobs`,
        JSON.stringify(job),
      );
    } else {
      [_, error] = await redisRPush(
        `${job.container_sha}.Jobs`,
        JSON.stringify(job),
      );
    }
    if (error) {
      throw error;
    }
  });
};

const clearPentUpJobs = async (
  containerSHA: string,
  clearImmediateJobs: boolean = false,
) => {
  const dockerQueueKey = `${containerSHA}.${
    clearImmediateJobs && "Immediate"
  }Jobs`;
  let currentJobString = await withLock(async () => redisLPop(dockerQueueKey));
  while (currentJobString) {
    const job: GradingJob = JSON.parse(currentJobString);
    if (clearImmediateJobs) {
      await withLock(async () => await createImmediateJob(job));
    } else {
      await withLock(async () => await createJob(job, Date.now()));
    }
    currentJobString = await withLock(async () => redisLPop(dockerQueueKey));
  }
};

export const clearOutDockerQueues = async (containerSHA: string) => {
  await clearPentUpJobs(containerSHA);
  await clearPentUpJobs(containerSHA, true);
};
