import { client } from "../index";

// TODO: Implement logic for moving GradingJobs position in Redis Queue.

// TODO: Fix typing everywhere

// TODO: Move these to constants file
const LIFETIME_BUFFER = 86400; // 1 day in seconds
const MOVE_TO_BACK_BUFFER = 10; // 10 seconds

// TODO: Check out to use zAdd with this redis library

// TODO: type update_config
const moveGradingJob = async (sub_id: string, update_config: Object) => {
  // TODO: Check if valid
  const new_priority_pos = update_config["priority"]; // 'front' or 'back'
  const grading_job_to_move = await client.get(`QueuedGradingInfo.${sub_id}`);

  if (!grading_job_to_move) {
    // error - job not found
    return -1;
  }

  const grading_job: Object = JSON.parse(grading_job_to_move);

  let new_priority: number = -1;
  if (new_priority_pos === "front") {
    new_priority = await moveGradingJobToFront(
      sub_id,
      grading_job,
      update_config
    );
  } else if (new_priority_pos === "back") {
    new_priority = await moveGradingJobToBack(
      sub_id,
      grading_job,
      update_config
    );
  } else {
    // error - invalid priority (must be 'front' or 'back')
    return -1;
  }
  // new_priority will be -1 if something went wrong
  return new_priority;
};

// TODO: Make this async?
const moveGradingJobToFront = async (
  sub_id: string,
  grading_job: Object,
  config: Object
) => {
  const new_priority: number = new Date().getTime(); // timestamp now

  // Find GradingQueue Entry
  const priority: number = grading_job["priority"];
  const grading_queue_entry_results = await client.zRangeByScore(
    "GradingQueue",
    priority,
    priority
  );
  if (grading_queue_entry_results.length === 0) {
    // Error - did not find grading job
    return -1;
  }
  // Searched exactly for given 'priority' so it is first and only entry
  const grading_queue_entry: string = grading_queue_entry_results[0];

  // TODO: Abstract
  const updated_grading_job = { ...grading_job, priority: new_priority };
  // Update priority
  await client.set(
    `QueuedGradingInfo.${sub_id}`,
    JSON.stringify(updated_grading_job)
  );

  // TODO: Abstract
  if (config["user_id"] || config["team_id"]) {
    // Move Submitter Info
    const submitter_info_key = config["user_id"]
      ? `SubmitterInfo.user.${config["user_id"]}`
      : `SubmitterInfo.team.${config["team_id"]}`;
    // Check if it is the only submitterinfo entry in the list - don't need to move
    const submitter_info_list: string[] = await client.lRange(
      submitter_info_key,
      0,
      -1
    );
    if (submitter_info_list.length > 1) {
      // Move to front of SubmitterInfo list
      await client.lRem(submitter_info_key, -1, `${sub_id}`);
      client.lPush(submitter_info_key, `${sub_id}`);
    }
  } else {
    // Submission Id - No Submitter Info
  }
  client.zAdd("GradingQueue", [
    { score: new_priority, value: grading_queue_entry },
  ]);
  return new_priority;
};

const moveGradingJobToBack = async (
  sub_id: string,
  grading_job: Object,
  config: Object
): Promise<number> => {
  // TODO: test this
  const last_job_info: Object[] = await client.zRangeWithScores(
    "GradingQueue",
    -1,
    -1
  );
  if (last_job_info.length === 0) {
    // Error - last job not found
    return -1;
  }
  const last_job_priority: number = last_job_info[0]["score"];
  const new_priority: number = last_job_priority + MOVE_TO_BACK_BUFFER;
  const lifetime: number = new_priority + LIFETIME_BUFFER;

  // TODO: Abstract this
  // Find GradingQueue Entry
  const priority: number = grading_job["priority"];

  const grading_queue_entry_results: string[] = await client.zRangeByScore(
    "GradingQueue",
    priority,
    priority
  );
  if (grading_queue_entry_results.length === 0) {
    // Error - did not find grading job
    return -1;
  }
  // Searched exactly for given 'priority' so it is first and only entry
  const grading_queue_entry: string = grading_queue_entry_results[0];

  const updated_grading_job = { ...grading_job, priority: new_priority };
  // Update priority
  await client.set(
    `QueuedGradingInfo.${sub_id}`,
    JSON.stringify(updated_grading_job)
  );
  client.expireAt(`QueuedGradingInfo.${sub_id}`, lifetime);

  // TODO: Abstract some of this
  if (config["user_id"] || config["team_id"]) {
    // Move Submitter Info
    const submitter_info_key = config["user_id"]
      ? `SubmitterInfo.user.${config["user_id"]}`
      : `SubmitterInfo.team.${config["team_id"]}`;

    // Check if it is the only submitterinfo entry in the list - don't need to move
    const submitter_info_list: string[] = await client.lRange(
      submitter_info_key,
      0,
      -1
    );
    if (submitter_info_list.length > 1) {
      // Move to back of SubmitterInfo list
      await client.lRem(submitter_info_key, -1, `${sub_id}`);
      await client.rPush(submitter_info_key, `${sub_id}`);
    }
    client.expireAt(submitter_info_key, lifetime);
  } else {
    // Submission Id - No Submitter Info to Move
  }
  client.zAdd("GradingQueue", [
    { score: new_priority, value: grading_queue_entry },
  ]);
  return new_priority;
};

export default moveGradingJob;
