import { generateGradingJobFromConfig } from "../utils/helpers";
import { redisGet, redisSet } from "../utils/redis";
import { GradingJob, GradingJobConfig } from "./types";

const updateGradingJob = async (
  gradingJobConfig: GradingJobConfig,
): Promise<Error | null> => {
  const [gradingJobStr, getErr] = await redisGet(gradingJobConfig.key);
  if (getErr) return getErr;
  if (!gradingJobStr)
    return Error("Failed to find existing job when updating grading job.");

  let gradingJob: GradingJob;
  try {
    gradingJob = JSON.parse(gradingJobStr);
  } catch (error) {
    return Error("Failed to update existing grading job.");
  }

  const updatedGradingJob = generateGradingJobFromConfig(
    gradingJobConfig,
    gradingJob.created_at,
    gradingJob.release_at,
  );
  const [setStatus, setErr] = await redisSet(gradingJob.key, updatedGradingJob);
  if (setErr) return setErr;
  if (setStatus !== "OK") return Error("Failed to set grading job");
  return null;
};
export default updateGradingJob;
