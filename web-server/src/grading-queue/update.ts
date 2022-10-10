import {
  calculateLifetime,
  formatGradingJob,
  setGradingInfoWithLifetime,
} from "../utils/helpers";
import { GradingJobConfig } from "./types";

const updateGradingJob = async (
  grading_info_key: string,
  grading_job_config: GradingJobConfig
): Promise<Error | null> => {
  // TODO: Abstract this from here and create.ts
  const now = new Date().getTime();
  // priority field is a delay in ms
  const release_at = now + grading_job_config.priority;

  const [lifetime, lifetime_err] = await calculateLifetime(
    grading_info_key,
    release_at
  );
  if (lifetime_err) return lifetime_err;

  // Set QueuedGradingInfo
  const grading_job = formatGradingJob(grading_job_config, release_at, now);

  const grading_info_err = await setGradingInfoWithLifetime(
    grading_info_key,
    grading_job,
    lifetime!
  );
  if (grading_info_err) return grading_info_err;
  return null;
};
export default updateGradingJob;
