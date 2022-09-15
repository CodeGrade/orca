import { GradingJob, GradingQueueEntry, MoveConfig } from "./types";
import { LIFETIME_BUFFER, MOVE_TO_BACK_BUFFER } from "./constants";
import {
  redisExpireAt,
  redisExpireTime,
  redisGet,
  redisZRangeWithScores,
} from "../utils/redis";
import { updateGradingQueue, setGradingInfo } from "../utils/helpers";

const moveGradingJob = async (
  submission_id: string,
  move_config: MoveConfig
): Promise<[number | null, Error | null]> => {
  const new_priority_pos: string = move_config.priority; // 'release' or 'delay'
  const nonce: string = move_config.nonce;
  const grading_info_key = `QueuedGradingInfo.${submission_id}`;

  const [grading_job_to_move, get_err] = await redisGet(grading_info_key);
  if (get_err) return [null, get_err];

  const grading_job: GradingJob = JSON.parse(grading_job_to_move!);
  const submitter_str = move_config.user_id
    ? `user.${move_config.user_id}`
    : `team.${move_config.team_id}`;
  const grading_queue_key = `${submitter_str}.${nonce}`;

  let new_priority: number | null, move_err: Error | null;
  if (new_priority_pos === "release") {
    [new_priority, move_err] = await releaseGradingJob(
      grading_info_key,
      grading_queue_key,
      grading_job
    );
  } else if (new_priority_pos === "delay") {
    [new_priority, move_err] = await delayGradingJob(
      grading_info_key,
      submitter_str,
      grading_queue_key,
      grading_job
    );
  } else {
    // TODO: Move this validation to middleware
    return [
      null,
      Error(
        "Invalid priority given when attempting to move job - must be 'release' or 'delay'"
      ),
    ];
  }
  if (move_err) return [null, move_err];
  return [new_priority, null];
};

const releaseGradingJob = async (
  grading_info_key: string,
  grading_queue_key: string,
  grading_job: GradingJob
): Promise<[number | null, Error | null]> => {
  const new_priority: number = new Date().getTime(); // timestamp now

  // Get existing lifetime to re-set after updating QueuedGradingInfo
  const [lifetime, lifetime_err] = await redisExpireTime(grading_info_key);
  if (lifetime_err) return [null, lifetime_err];

  const updated_grading_job = { ...grading_job, priority: new_priority };
  const set_err = await setGradingInfo(
    grading_info_key,
    updated_grading_job,
    lifetime!
  );
  if (set_err) return [null, set_err];

  const gq_err = await updateGradingQueue(grading_queue_key, new_priority);
  if (gq_err) return [null, gq_err];
  return [new_priority, null];
};

const delayGradingJob = async (
  grading_info_key: string,
  submitter_str: string,
  grading_queue_key: string,
  grading_job: GradingJob
): Promise<[number | null, Error | null]> => {
  // Get last job in GradingQueue to figure out the delay priority
  const [last_job, last_job_err] = await redisZRangeWithScores(
    "GradingQueue",
    -1,
    -1
  );
  if (last_job_err) return [null, last_job_err];
  if (last_job.length === 0)
    return [
      null,
      Error(
        "No jobs found in grading queue when trying to delay this grading job"
      ),
    ];

  const last_job_priority: number = last_job[0]["score"];
  // Calculate new priority and redis object lifetimes
  const new_priority = last_job_priority + MOVE_TO_BACK_BUFFER;
  const lifetime = new_priority + LIFETIME_BUFFER;

  const updated_grading_job = { ...grading_job, priority: new_priority };
  const set_err = await setGradingInfo(
    grading_info_key,
    updated_grading_job,
    lifetime!
  );
  if (set_err) return [null, set_err];

  const [submitter_info_exp, submitter_info_exp_err] = await redisExpireAt(
    `SubmitterInfo.${submitter_str}`,
    lifetime
  );
  if (submitter_info_exp_err) return [null, submitter_info_exp_err];
  if (!submitter_info_exp)
    return [
      null,
      Error(
        "Failed to set expiration on submitter info when delaying grading job."
      ),
    ];

  const gq_err = await updateGradingQueue(grading_queue_key, new_priority);
  if (gq_err) return [null, gq_err];

  return [new_priority, null];
};

export default moveGradingJob;
