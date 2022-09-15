import { client } from "../index";
import { GradingJob, GradingQueueEntry, MoveConfig } from "./types";
import { LIFETIME_BUFFER, MOVE_TO_BACK_BUFFER } from "./constants";

const getGradingJobToMove = async (
  key: string
): Promise<[string | null, Error | null]> => {
  try {
    const grading_job_to_move: string | null = await client.get(key);
    // grading_job_to_move will be null if key not found
    if (!grading_job_to_move)
      return [null, Error("Grading job attempting to be moved was not found.")];
    return [grading_job_to_move, null];
  } catch (error) {
    if (error instanceof Error) return [null, error];
    return [null, Error("Something went wrong retreiving grading job to move")];
  }
};

const moveGradingJob = async (
  submission_id: string,
  move_config: MoveConfig
): Promise<[number | null, Error | null]> => {
  const new_priority_pos: string = move_config.priority; // 'release' or 'delay'
  const nonce: string = move_config.nonce;

  const [grading_job_to_move, grading_job_to_move_err] =
    await getGradingJobToMove(`QueuedGradingInfo.${submission_id}`);
  if (!grading_job_to_move || grading_job_to_move_err)
    return [null, grading_job_to_move_err];

  try {
    const grading_job: GradingJob = JSON.parse(grading_job_to_move);

    let new_priority: number | null, move_err: Error | null;
    if (new_priority_pos === "release") {
      [new_priority, move_err] = await releaseGradingJob(
        submission_id,
        nonce,
        grading_job,
        move_config
      );
    } else if (new_priority_pos === "delay") {
      [new_priority, move_err] = await delayGradingJob(
        submission_id,
        nonce,
        grading_job,
        move_config
      );
    } else {
      // TODO: Move this validation to controller
      return [
        null,
        Error(
          "Invalid priority given when attempting to move job - must be 'release' or 'delay'"
        ),
      ];
    }
    if (move_err) return [null, move_err];
    if (!new_priority)
      return [
        null,
        Error(
          "Something went wrong when attempting to move grading job - priority was never updated"
        ),
      ];
    return [new_priority, null];
  } catch (error) {
    if (error instanceof Error) return [null, error];
    return [
      null,
      Error("Something went wrong when attempting to move this grading job."),
    ];
  }
};

const updateGradingQueue = async (
  key: string,
  priority: number
): Promise<Error | null> => {
  try {
    await client.zAdd("GradingQueue", [{ score: priority, value: key }]);
    return null;
  } catch (error) {
    if (error instanceof Error) return error;
    return Error("Failed to update grading queue when moving this grading job");
  }
};

const updateGradingJob = async (
  submission_id: string,
  priority: number,
  grading_job: GradingJob
): Promise<Error | null> => {
  const updated_grading_job = { ...grading_job, priority: priority };
  try {
    await client.set(
      `QueuedGradingInfo.${submission_id}`,
      JSON.stringify(updated_grading_job)
    );
    return null;
  } catch (error) {
    if (error instanceof Error) return error;
    return Error(
      "Failed to update the queued grading info when moving this grading job"
    );
  }
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

const releaseGradingJob = async (
  submission_id: string,
  nonce: string,
  grading_job: GradingJob,
  config: MoveConfig
): Promise<[number | null, Error | null]> => {
  const new_priority: number = new Date().getTime(); // timestamp now

  // getSubmitterKeyFromConfig will return empty string for direct submission
  const submitter_key_str =
    getSubmitterKeyFromConfig(config) || `sub.${submission_id}`;

  try {
    const update_grading_queue_err = await updateGradingQueue(
      `${submitter_key_str}.${nonce}`,
      new_priority
    );
    if (update_grading_queue_err) return [null, update_grading_queue_err];

    // Get current expireTime since updating entry removes it
    // TODO: Set this to something lower?
    const lifetime = await client.expireTime(
      `QueuedGradingInfo.${submission_id}`
    );
    const updated_grading_job_err = await updateGradingJob(
      submission_id,
      new_priority,
      grading_job
    );
    if (updated_grading_job_err) return [null, updated_grading_job_err];

    await client.expireAt(`QueuedGradingInfo.${submission_id}`, lifetime);

    return [new_priority, null];
  } catch (error) {
    if (error instanceof Error) return [null, error];
    return [
      null,
      Error("Something went wrong while releasing this grading job"),
    ];
  }
};

const delayGradingJob = async (
  submission_id: string,
  nonce: string,
  grading_job: GradingJob,
  config: MoveConfig
): Promise<[number | null, Error | null]> => {
  try {
    const last_job_info: GradingQueueEntry[] = await client.zRangeWithScores(
      "GradingQueue",
      -1,
      -1
    );
    // GradingQueue is empty
    if (last_job_info.length === 0) {
      return [
        null,
        Error(
          "No jobs found in grading queue when trying to delay this grading job"
        ),
      ];
    }
    const last_job_priority: number = last_job_info[0]["score"];
    // Calculate new priority and redis object lifetimes
    const new_priority: number = last_job_priority + MOVE_TO_BACK_BUFFER;
    const lifetime: number = new_priority + LIFETIME_BUFFER;

    // TODO: REFACTOR ONCE GRADINGJOB IS REDEFINED
    // -- This causes a bug for how we currently handle duplicate submission_id jobs

    // getSubmitterKeyFromConfig will return empty string for direct submission
    let submitter_key_str = getSubmitterKeyFromConfig(config);
    if (submitter_key_str) {
      await client.expireAt(`SubmitterInfo.${submitter_key_str}`, lifetime);
    } else {
      submitter_key_str = `sub.${submission_id}`;
    }

    const update_grading_queue_err = await updateGradingQueue(
      `${submitter_key_str}.${nonce}`,
      new_priority
    );
    if (update_grading_queue_err) return [null, update_grading_queue_err];

    const updated_grading_job_err = await updateGradingJob(
      submission_id,
      new_priority,
      grading_job
    );
    if (updated_grading_job_err) return [null, updated_grading_job_err];

    await client.expireAt(`QueuedGradingInfo.${submission_id}`, lifetime);
    return [new_priority, null];
  } catch (error) {
    if (error instanceof Error) return [null, error];
    return [null, Error("Something went wrong when delaying this grading job")];
  }
};

export default moveGradingJob;
