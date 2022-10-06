import { GradingJob, MoveConfig, GradingQueueEntry } from "./types";
import { LIFETIME_BUFFER, MOVE_TO_BACK_BUFFER } from "./constants";
import {
  redisExpireAt,
  redisExpireTime,
  redisGet,
  redisLIndex,
  redisLInsertAfter,
  redisLInsertBefore,
  redisLPush,
  redisLRange,
  redisLRem,
  redisRPush,
  redisZRangeWithScores,
} from "../utils/redis";
import {
  updateGradingQueue,
  setGradingInfoWithLifetime,
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
  const timestamp: number = parseInt(nonce);
  const grading_info_key = `QueuedGradingInfo.${submission_id}`;

  const [grading_job_to_move, get_err] = await redisGet(grading_info_key);
  if (get_err) return [null, get_err];

  const grading_job: GradingJob = JSON.parse(grading_job_to_move!);
  const submitter_str = move_config.user_id
    ? `user.${move_config.user_id}`
    : `team.${move_config.team_id}`;
  const grading_queue_key = `${submitter_str}.${nonce}`;

  let move_err: Error | null;
  let new_release_at: number | null = null;
  const now = new Date().getTime();
  switch (move_position) {
    case MOVE_POSITION.RELEASE:
      [new_release_at, move_err] = await releaseGradingJob(
        grading_info_key,
        submitter_str,
        grading_job,
        now,
        submission_id
      );
      break;
    case MOVE_POSITION.DELAY:
      [new_release_at, move_err] = await delayGradingJob(
        grading_info_key,
        submitter_str,
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

// TODO: Simplify this by using looping over SubmitterInfo list and checking release_at timestamps
const getLastReleasedSubmissionIndexOfSubmitter = async (
  submitter_str: string,
  now: number
): Promise<[number | null, Error | null]> => {
  const [grading_queue, zrange_err] = await redisZRangeWithScores(
    "GradingQueue",
    0,
    -1
  );
  if (zrange_err) return [null, zrange_err];
  if (!grading_queue || !grading_queue.length)
    return [null, Error("No jobs found when trying to release grading job")];

  let last_released_ind = -1;
  for (let i = 0; i < grading_queue.length; i++) {
    const entry: GradingQueueEntry = grading_queue[i];
    if (!entry.value.startsWith(`${submitter_str}.`)) {
      // Entry is not for the submitter we care about
      continue;
    }
    last_released_ind++;
    const released = entry.score < now;
    if (!released) {
      last_released_ind--;
      return [last_released_ind, null];
    }
  }
  if (last_released_ind === -1)
    return [
      null,
      Error("No jobs found for given submitter while releasing grading job."),
    ];
  return [
    null,
    Error("Failed to release grading job - all jobs are already released"),
  ];
};

const releaseGradingJob = async (
  grading_info_key: string,
  submitter_str: string,
  grading_job: GradingJob,
  now: number,
  submission_id: string
): Promise<[number | null, Error | null]> => {
  const new_release_at = now;
  // Get existing lifetime to re-set after updating QueuedGradingInfo
  const [lifetime, lifetime_err] = await redisExpireTime(grading_info_key);
  if (lifetime_err) return [null, lifetime_err];

  // Get index of last released job
  const [last_released_ind, last_released_ind_err] =
    await getLastReleasedSubmissionIndexOfSubmitter(submitter_str, now);
  if (last_released_ind_err) return [null, last_released_ind_err];

  // Update QueuedGradingInfo of GradingJob with release_at now
  const updated_grading_job: GradingJob = {
    ...grading_job,
    release_at: new_release_at,
  };
  const set_err = await setGradingInfoWithLifetime(
    grading_info_key,
    updated_grading_job,
    lifetime!
  );
  if (set_err) return [null, set_err];

  // Move submission position in SubmitterInfo list
  const submitter_info_key = `SubmitterInfo.${submitter_str}`;

  // TODO: If moving to front - check if already at front

  // Remove existing submission id in list
  const [num_removed, remove_err] = await redisLRem(
    submitter_info_key,
    submission_id
  );
  if (remove_err) return [null, remove_err];
  if (!num_removed)
    return [
      null,
      Error(
        "Did not find submission id in SubmitterInfo list while releasing grading job."
      ),
    ];

  // There are no released job - push back onto front of list
  if (last_released_ind === -1) {
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
    // Get submission id at the last released index
    const [last_released_id, last_released_id_err] = await redisLIndex(
      submitter_info_key,
      last_released_ind!
    );
    if (last_released_id_err) return [null, last_released_id_err];

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
  submitter_str: string,
  grading_job: GradingJob,
  submission_id: string
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

  const last_job_release_at: number = last_job[0]["score"];
  // Calculate new priority and redis object lifetimes
  const new_release_at = last_job_release_at + MOVE_TO_BACK_BUFFER;
  const lifetime = new_release_at + LIFETIME_BUFFER;

  // Update QueuedGradingInfo of GradingJob
  const updated_grading_job: GradingJob = {
    ...grading_job,
    release_at: new_release_at,
  };
  const set_err = await setGradingInfoWithLifetime(
    grading_info_key,
    updated_grading_job,
    lifetime!
  );
  if (set_err) return [null, set_err];

  // Update submission id position in SubmitterInfo list
  const submitter_info_key = `SubmitterInfo.${submitter_str}`;
  // Remove existing submission id in list
  const [num_removed, remove_err] = await redisLRem(
    submitter_info_key,
    submission_id
  );
  if (remove_err) return [null, remove_err];
  if (!num_removed)
    return [
      null,
      Error(
        "Did not find submission id in SubmitterInfo list while delaying grading job."
      ),
    ];

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

  // Update SubmitterInfo list lifetime
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

  return [new_release_at, null];
};

export default moveGradingJob;
