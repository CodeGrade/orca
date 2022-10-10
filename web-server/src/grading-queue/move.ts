import { GradingJob, MoveConfig } from "./types";
import { LIFETIME_BUFFER, MOVE_TO_BACK_BUFFER } from "./constants";
import {
  redisExpireAt,
  redisExpireTime,
  redisGet,
  redisLInsertAfter,
  redisLPush,
  redisLRange,
  redisLRem,
  redisRPush,
  redisZRangeWithScores,
} from "../utils/redis";
import {
  updateGradingQueue,
  setGradingInfoWithLifetime,
  getSubmitterInfo,
} from "../utils/helpers";

enum MOVE_POSITION {
  RELEASE,
  DELAY,
}

const moveGradingJob = async (
  submission_id: string,
  move_config: MoveConfig
): Promise<[number | null, Error | null]> => {
  const move_position: MOVE_POSITION = MOVE_POSITION[move_config.priority];
  const nonce: string = move_config.nonce;
  const grading_info_key = `QueuedGradingInfo.${submission_id}`;

  const [grading_job_to_move, get_err] = await redisGet(grading_info_key);
  if (get_err) return [null, get_err];

  // TODO: try catch this
  const grading_job: GradingJob = JSON.parse(grading_job_to_move!);
  const submitter_str = move_config.user_id
    ? `user.${move_config.user_id}`
    : `team.${move_config.team_id}`;
  const grading_queue_key = `${submitter_str}.${nonce}`;
  const submitter_info_key = `SubmitterInfo.${submitter_str}`;

  let move_err: Error | null;
  let new_release_at: number | null = null;
  const now = new Date().getTime();
  switch (move_position) {
    case MOVE_POSITION.RELEASE:
      [new_release_at, move_err] = await releaseGradingJob(
        grading_info_key,
        submitter_info_key,
        grading_job,
        now,
        submission_id
      );
      break;
    case MOVE_POSITION.DELAY:
      [new_release_at, move_err] = await delayGradingJob(
        grading_info_key,
        submitter_info_key,
        grading_job,
        submission_id
      );
      break;
    default:
      // TODO: Move this validation to middleware
      return [
        null,
        Error(
          "Invalid priority given when attempting to move job - must be 'release' or 'delay'"
        ),
      ];
  }
  if (move_err) return [null, move_err];
  if (!new_release_at)
    return [null, Error("Something went wrong while moving grading job.")];

  const gq_err = await updateGradingQueue(grading_queue_key, new_release_at);
  if (gq_err) return [null, gq_err];

  return [new_release_at, null];
};

// TODO: Move to move_helpers file
const getLastReleasedSubmissionIdOfSubmitter = async (
  submitter_info: string[],
  now: number
): Promise<[string | null, Error | null]> => {
  try {
    let last_released_id: string | null = null;
    for (let i = 0; i < submitter_info.length; i++) {
      const sub_id = submitter_info[i];
      const [grading_job_str, get_err] = await redisGet(
        `QueuedGradingInfo.${sub_id}`
      );
      if (get_err) throw get_err;
      if (!grading_job_str)
        throw Error("Failed to retrieve information when moving grading job");

      const grading_job: GradingJob = JSON.parse(grading_job_str);
      const released = grading_job.release_at < now;
      if (!released) {
        return [last_released_id, null];
      }
      last_released_id = sub_id;
    }
    return [last_released_id, null];
  } catch (error) {
    return [null, error];
  }
};

const updateGradingInfoForMove = async (
  grading_job: GradingJob,
  release_at: number,
  grading_info_key: string,
  lifetime: number
): Promise<Error | null> => {
  // Update QueuedGradingInfo of GradingJob with release_at now
  const updated_grading_job: GradingJob = {
    ...grading_job,
    release_at: release_at,
  };
  const set_err = await setGradingInfoWithLifetime(
    grading_info_key,
    updated_grading_job,
    lifetime!
  );
  if (set_err) return set_err;
  return null;
};

const removeSubIdFromSubmitterInfo = async (
  submitter_info_key: string,
  submission_id: string
): Promise<Error | null> => {
  // Remove existing submission id in list
  const [num_removed, remove_err] = await redisLRem(
    submitter_info_key,
    submission_id
  );
  if (remove_err) return remove_err;
  if (!num_removed)
    return Error(
      "Did not find submission id in SubmitterInfo list while releasing grading job."
    );
  return null;
};

const isOnlySubInSubmitterInfo = async (
  submitter_info_key: string
): Promise<[boolean | null, Error | null]> => {
  const [submitter_info, lrange_err] = await getSubmitterInfo(
    submitter_info_key
  );
  if (lrange_err) return [null, lrange_err];
  if (!submitter_info || !submitter_info.length)
    return [null, Error("Something went wrong while getting SubmitterInfo.")];
  return [submitter_info!.length === 1, null];
};

const getLastJobInGradingQueue = async (): Promise<
  [string | null, Error | null]
> => {
  const [last_job, last_job_err] = await redisZRangeWithScores(
    "GradingQueue",
    -1,
    -1
  );
  if (last_job_err) return [null, last_job_err];
  if (!last_job || last_job.length === 0)
    return [
      null,
      Error("No jobs found in grading queue when trying to delay grading job"),
    ];
  return [last_job, null];
};

const releaseGradingJob = async (
  grading_info_key: string,
  submitter_info_key: string,
  grading_job: GradingJob,
  now: number,
  submission_id: string
): Promise<[number | null, Error | null]> => {
  const new_release_at = now;
  // Get existing lifetime to re-set after updating QueuedGradingInfo
  const [lifetime, lifetime_err] = await redisExpireTime(grading_info_key);
  if (lifetime_err) return [null, lifetime_err];

  const update_err = await updateGradingInfoForMove(
    grading_job,
    new_release_at,
    grading_info_key,
    lifetime!
  );
  if (update_err) return [null, update_err];

  const [submitter_info, submitter_info_err] = await getSubmitterInfo(
    submitter_info_key
  );
  if (submitter_info_err) return [null, submitter_info_err];
  if (!submitter_info || !submitter_info.length)
    return [null, Error("Something went wrong while getting SubmitterInfo.")];

  // Short circuit: Only job in submitter info - don't need to move
  if (submitter_info!.length === 1) return [new_release_at, null];

  const remove_err = await removeSubIdFromSubmitterInfo(
    submitter_info_key,
    submission_id
  );
  if (remove_err) return [null, remove_err];

  // Get index of last released job
  const [last_released_id, last_released_id_err] =
    await getLastReleasedSubmissionIdOfSubmitter(submitter_info!, now);
  if (last_released_id_err) return [null, last_released_id_err];

  // There are no released job - push back onto front of list
  if (!last_released_id) {
    const [num_pushed, push_err] = await redisLPush(
      submitter_info_key,
      submission_id
    );
    if (push_err) return [null, push_err];
    if (!num_pushed)
      return [
        null,
        Error(
          "Failed to push submission id to SubmitterInfo list while releasing grading job."
        ),
      ];
  } else {
    // Insert submission id into list
    const [sub_info_len, insert_err] = await redisLInsertAfter(
      submitter_info_key,
      last_released_id,
      submission_id
    );
    if (insert_err) return [null, insert_err];
  }
  return [new_release_at, null];
};

const delayGradingJob = async (
  grading_info_key: string,
  submitter_info_key: string,
  grading_job: GradingJob,
  submission_id: string
): Promise<[number | null, Error | null]> => {
  // Get last job in GradingQueue to figure out the delay priority
  const [last_job, last_job_err] = await getLastJobInGradingQueue();
  if (last_job_err) return [null, last_job_err];

  const last_job_release_at: number = last_job![0]["score"];
  // Calculate new priority and redis object lifetimes
  const new_release_at = last_job_release_at + MOVE_TO_BACK_BUFFER;
  const lifetime = new_release_at + LIFETIME_BUFFER;

  const update_err = await updateGradingInfoForMove(
    grading_job,
    new_release_at,
    grading_info_key,
    lifetime!
  );
  if (update_err) return [null, update_err];

  // Update SubmitterInfo list lifetime
  const [submitter_info_exp, submitter_info_exp_err] = await redisExpireAt(
    submitter_info_key,
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

  // Short circuit: Only job in submitter info - don't need to move
  if (await isOnlySubInSubmitterInfo(submitter_info_key))
    return [new_release_at, null];

  // Update submission id position in SubmitterInfo list
  // Remove existing submission id in list
  const remove_err = await removeSubIdFromSubmitterInfo(
    submitter_info_key,
    submission_id
  );
  if (remove_err) return [null, remove_err];

  // RPUSH submission id back onto list
  const [num_pushed, push_err] = await redisRPush(
    submitter_info_key,
    submission_id
  );
  if (push_err) return [null, push_err];
  if (!num_pushed)
    return [
      null,
      Error(
        "Failed to push submission id to SubmitterInfo list while delaying grading job."
      ),
    ];

  return [new_release_at, null];
};

export default moveGradingJob;
