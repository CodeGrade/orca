import {
  addToGradingQueue,
  calculateLifetime,
  generateGradingInfoKey,
  getNextTaskString,
  setGradingInfo,
  setSubmitterInfo,
} from "../utils/helpers";

const createStudentGradingJob = async (
  grading_job_config: any
): Promise<Error | null> => {
  const now = new Date().getTime();
  const sub_id = grading_job_config["submission_id"];
  // priority field is a delay in ms
  const priority = now + grading_job_config["priority"];
  const grading_info_key = generateGradingInfoKey(sub_id);

  const [lifetime, lifetime_err] = await calculateLifetime(
    grading_info_key,
    priority
  );
  if (lifetime_err) return lifetime_err;

  // TODO: Don't do this?
  // Update priority to reflect release timestamp rather than just the delay
  grading_job_config.priority = priority;

  // Set QueuedGradingInfo
  const grading_info_err = await setGradingInfo(
    grading_info_key,
    grading_job_config,
    lifetime!
  );
  if (grading_info_err) return grading_info_err;

  // Set SubmitterInfo
  const submitter_str = getNextTaskString(grading_job_config);
  const submitter_info_err = await setSubmitterInfo(
    submitter_str,
    sub_id,
    lifetime!
  );
  if (submitter_info_err) return submitter_info_err;

  // Add job to GradingQueue
  const gq_err = await addToGradingQueue(`${submitter_str}.${now}`, priority);
  if (gq_err) return gq_err;

  // No errors
  return null;
};
export default createStudentGradingJob;
