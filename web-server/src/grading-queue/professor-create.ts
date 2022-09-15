import {
  generateGradingInfoKey,
  calculateLifetime,
  setGradingInfo,
  addToGradingQueue,
} from "../utils/helpers";

const createProfessorGradingJob = async (
  grading_job_config: any
): Promise<Error | null> => {
  const now = new Date().getTime();
  const sub_id = grading_job_config["submission_id"];
  // priority field is a delay in ms
  // TODO: Are we adding professor delay here or is it received with it (should be a low constant)
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

  // Add job to GradingQueue
  const gq_err = await addToGradingQueue(`sub.${sub_id}.${now}`, priority);
  if (gq_err) return gq_err;

  // No errors
  return null;
};
export default createProfessorGradingJob;
