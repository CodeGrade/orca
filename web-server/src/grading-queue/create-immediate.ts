import {
  generateGradingInfoKey,
  calculateLifetime,
  setGradingInfoWithLifetime,
  addToGradingQueue,
  formatGradingJob,
} from "../utils/helpers";
import { GradingJobConfig } from "./types";

const createImmediateGradingJob = async (
  grading_job_config: GradingJobConfig
): Promise<Error | null> => {
  const sub_id = grading_job_config["submission_id"];

  const now = new Date().getTime();
  const release_at = now + grading_job_config.priority;

  const grading_info_key = generateGradingInfoKey(sub_id);

  const [lifetime, lifetime_err] = await calculateLifetime(
    grading_info_key,
    release_at
  );
  if (lifetime_err) return lifetime_err;

  // Set QueuedGradingInfo
  const grading_job = formatGradingJob(grading_job_config, release_at, now);
  // TODO: How does overwriting the release timestamp of QueuedGradingInfo work if
  //       there is a student job with the same submission id
  const grading_info_err = await setGradingInfoWithLifetime(
    grading_info_key,
    grading_job,
    lifetime!
  );
  if (grading_info_err) return grading_info_err;

  // Add job to GradingQueue
  const gq_err = await addToGradingQueue(`sub.${sub_id}.${now}`, release_at);
  if (gq_err) return gq_err;

  // No errors
  return null;
};
export default createImmediateGradingJob;
