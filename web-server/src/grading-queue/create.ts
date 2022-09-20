import {
  addToGradingQueue,
  calculateLifetime,
  generateGradingInfoKey,
  getNextTaskString,
  setGradingInfoWithLifetime,
  setSubmitterInfoWithLifetime,
} from "../utils/helpers";

const createStudentGradingJob = async (
  grading_job_config: any
): Promise<Error | null> => {
  const sub_id = grading_job_config["submission_id"];
  // priority field is a delay in ms
  const now = new Date().getTime();
  const priority = grading_job_config.priority;
  const release_at = now + priority;

  const grading_info_key = generateGradingInfoKey(sub_id);

  const [lifetime, lifetime_err] = await calculateLifetime(
    grading_info_key,
    release_at
  );
  if (lifetime_err) return lifetime_err;

  // Set QueuedGradingInfo
  const grading_info_err = await setGradingInfoWithLifetime(
    grading_info_key,
    grading_job_config,
    lifetime!
  );
  if (grading_info_err) return grading_info_err;

  // Set SubmitterInfo
  const submitter_str = getNextTaskString(grading_job_config);
  const submitter_info_err = await setSubmitterInfoWithLifetime(
    submitter_str,
    sub_id,
    lifetime!
  );
  if (submitter_info_err) return submitter_info_err;

  // Add job to GradingQueue
  // TODO: Hadve to make the GradingQueue score be priority rather than release_at? because otherwise
  // the priority of a grading job would be overwritten by an immediate grading job of the same submission id
  // const gq_err = await addToGradingQueue(`${submitter_str}.${now}`, release_at);
  const gq_err = await addToGradingQueue(`${submitter_str}.${now}`, release_at);
  if (gq_err) return gq_err;

  // No errors
  return null;
};
export default createStudentGradingJob;
