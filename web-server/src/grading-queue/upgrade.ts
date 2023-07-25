import { RedisClientType } from "redis";
import { OrcaRedisClient } from "./client";
import { removeNonImmediateJob } from "./delete";
import { GradingJob } from "./types";
import { createOrUpdateGradingJob } from "./create-or-update";

export const upgradeJob = async (gradingJob: GradingJob): Promise<void> => {
  const { key, collation } = gradingJob;
  await new OrcaRedisClient().runOperation(async (client: RedisClientType) => {
    const enrichedJob = await removeNonImmediateJob(client, key, collation);
    const gradingJob: GradingJob = enrichedJob;
    createOrUpdateGradingJob(client, gradingJob, true);
  }, true);
};
