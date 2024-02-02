import {
  GradingJobConfig,
  RedisTransactionBuilder,
  createOrUpdateJobTransaction,
  generateQueueKey,
} from "@codegrade-orca/common";
import { Redis } from "ioredis";
import { deleteGraderImageKeyTransaction } from "./delete-image-key";

export interface HoldingPenJobs {
  standardJobs: Array<GradingJobConfig>;
  immediateJobs: Array<GradingJobConfig>;
}

export const clearHoldingPenTransaction = (
  transactionBuilder: RedisTransactionBuilder,
  graderImageSHA: string,
): RedisTransactionBuilder => transactionBuilder.DEL(graderImageSHA);

export const releaseHoldingPenJobsTransaction = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  holdingPenJobs: HoldingPenJobs,
  graderImageSHA: string,
): Promise<RedisTransactionBuilder> => {
  deleteGraderImageKeyTransaction(transactionBuilder, graderImageSHA);
  const numImmediateJobs = holdingPenJobs.immediateJobs.length;
  await Promise.all(
    [...holdingPenJobs.immediateJobs, ...holdingPenJobs.standardJobs].map(
      async (jobConfig, i) => {
        await createOrUpdateJobTransaction(
          redisConnection,
          transactionBuilder,
          jobConfig,
          generateQueueKey(jobConfig.key, jobConfig.response_url),
          Date.now(),
          i < numImmediateJobs,
        );
      },
    ),
  );
  return transactionBuilder;
};

export const getHoldingPenJobs = async (
  redisConnection: Redis,
  graderImageSHA: string,
): Promise<HoldingPenJobs> => {
  return {
    standardJobs: await Promise.all(
      (
        await redisConnection.lrange(`${graderImageSHA}.jobs`, 0, -1)
      ).map((jobConfigStr) => JSON.parse(jobConfigStr) as GradingJobConfig),
    ),
    immediateJobs: await Promise.all(
      (
        await redisConnection.lrange(`${graderImageSHA}.immediateJobs`, 0, -1)
      ).map((jobConfigStr) => JSON.parse(jobConfigStr) as GradingJobConfig),
    ),
  };
};
