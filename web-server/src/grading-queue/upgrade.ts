import { removeNonImmediateJob } from "../utils/helpers";
import createImmediateJob from "./create-immediate";
import { GradingJob, GradingJobConfig } from "./types";

export const upgradeJob = async (
  gradingJob: GradingJobConfig | GradingJob,
): Promise<null | Error> => {
  const { key, collation } = gradingJob;
  const remErr = await removeNonImmediateJob(key, collation);
  if (remErr) return remErr;
  const createErr = await createImmediateJob(gradingJob);
  if (createErr) return createErr;
  return null;
};
