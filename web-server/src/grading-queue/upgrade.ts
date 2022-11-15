import { removeNonImmediateJob } from "../utils/helpers";
import createImmediateJob from "./create-immediate";
import { GradingJob, GradingJobConfig } from "./types";

export const upgradeJob = async (
  gradingJobConfig: GradingJobConfig,
): Promise<null | Error> => {
  const { key, collation } = gradingJobConfig;
  const remErr = await removeNonImmediateJob(key, collation);
  if (remErr) return remErr;
  const createErr = await createImmediateJob(gradingJobConfig);
  if (createErr) return createErr;
  return null;
};
