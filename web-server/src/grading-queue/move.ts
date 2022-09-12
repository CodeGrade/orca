import { client } from "../index";
import { GradingJob, GradingQueueEntry, MoveConfig } from "./types";
import { LIFETIME_BUFFER, MOVE_TO_BACK_BUFFER } from "./constants";

const moveGradingJob = async (
  submission_id: string,
  move_config: MoveConfig
) => {
  // TODO: Check if valid
  const new_priority_pos: string = move_config.priority; // 'front' or 'back'
  const nonce: string = move_config.nonce;
  const grading_job_to_move: string | null = await client.get(
    `QueuedGradingInfo.${submission_id}`
  );

  if (!grading_job_to_move) {
    // TODO: error - job not found
    return -1;
  }

  const grading_job: GradingJob = JSON.parse(grading_job_to_move);

  let new_priority: number = -1;
  if (new_priority_pos === "front") {
    new_priority = await moveGradingJobToFront(
      submission_id,
      nonce,
      grading_job,
      move_config
    );
  } else if (new_priority_pos === "back") {
    new_priority = await moveGradingJobToBack(
      submission_id,
      nonce,
      grading_job,
      move_config
    );
  } else {
    // TODO: error - invalid priority (must be 'front' or 'back')
    return -1;
  }
  // TODO: new_priority will be -1 if something went wrong
  return new_priority;
};

const updateGradingQueue = async (key: string, priority: number) => {
  await client.zAdd("GradingQueue", [{ score: priority, value: key }]);
};

const updateGradingJob = async (
  submission_id: string,
  priority: number,
  grading_job: GradingJob
) => {
  const updated_grading_job = { ...grading_job, priority: priority };
  await client.set(
    `QueuedGradingInfo.${submission_id}`,
    JSON.stringify(updated_grading_job)
  );
};

const getSubmitterKeyFromConfig = (config: MoveConfig) => {
  let submitter_str: string = "";
  if (config.team_id) {
    submitter_str = `team.${config.team_id}`;
  } else if (config.user_id) {
    submitter_str = `user.${config.user_id}`;
  } else {
    // Submission ID - no team or user id present
  }
  return submitter_str;
};

const moveGradingJobToFront = async (
  submission_id: string,
  nonce: string,
  grading_job: GradingJob,
  config: MoveConfig
): Promise<number> => {
  const new_priority: number = new Date().getTime(); // timestamp now

  // getSubmitterKeyFromConfig will return empty string for direct submission
  const submitter_key_str =
    getSubmitterKeyFromConfig(config) || `sub.${submission_id}`;

  // TODO: Error handling
  await updateGradingQueue(`${submitter_key_str}.${nonce}`, new_priority);
  // Get current expireTime since updating entry removes it
  // TODO: Set this to something lower?
  const lifetime = await client.expireTime(
    `QueuedGradingInfo.${submission_id}`
  );
  await updateGradingJob(submission_id, new_priority, grading_job);
  await client.expireAt(`QueuedGradingInfo.${submission_id}`, lifetime);

  return new_priority;
};

const moveGradingJobToBack = async (
  submission_id: string,
  nonce: string,
  grading_job: GradingJob,
  config: MoveConfig
): Promise<number> => {
  const last_job_info: GradingQueueEntry[] = await client.zRangeWithScores(
    "GradingQueue",
    -1,
    -1
  );
  if (last_job_info.length === 0) {
    // Error - last job not found
    return -1;
  }
  const last_job_priority: number = last_job_info[0]["score"];
  // Calculate new priority and redis object lifetimes
  const new_priority: number = last_job_priority + MOVE_TO_BACK_BUFFER;
  const lifetime: number = new_priority + LIFETIME_BUFFER;

  // getSubmitterKeyFromConfig will return empty string for direct submission
  let submitter_key_str = getSubmitterKeyFromConfig(config);
  if (submitter_key_str) {
    client.expireAt(`SubmitterInfo.${submitter_key_str}`, lifetime);
  } else {
    submitter_key_str = `sub.${submission_id}`;
  }

  // TODO: Error handling
  await updateGradingQueue(`${submitter_key_str}.${nonce}`, new_priority);
  await updateGradingJob(submission_id, new_priority, grading_job);
  await client.expireAt(`QueuedGradingInfo.${submission_id}`, lifetime);
  return new_priority;
};

export default moveGradingJob;
