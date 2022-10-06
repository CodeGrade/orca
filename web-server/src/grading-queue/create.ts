import {
  addToGradingQueue,
  calculateLifetime,
  formatGradingJob,
  generateGradingInfoKey,
  getNextTaskString,
  setGradingInfoWithLifetime,
  setSubmitterInfoWithLifetime,
} from "../utils/helpers";
import { GradingJobConfig } from "./types";

const createStudentGradingJob = async (
  grading_job_config: GradingJobConfig
): Promise<Error | null> => {
  const sub_id = grading_job_config["submission_id"];
  const now = new Date().getTime();
  // priority field is a delay in ms
  const release_at = now + grading_job_config.priority;

  const grading_info_key = generateGradingInfoKey(sub_id);

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

  // Set SubmitterInfo
  const submitter_str = getNextTaskString(grading_job);
  const submitter_info_err = await setSubmitterInfoWithLifetime(
    submitter_str,
    sub_id,
    lifetime!
  );
  if (submitter_info_err) return submitter_info_err;

  // Add job to GradingQueue
  const gq_err = await addToGradingQueue(`${submitter_str}.${now}`, release_at);
  if (gq_err) return gq_err;

  // No errors
  return null;
};
export default createStudentGradingJob;
