import { client } from "../index";

// Removing Jobs from the Redis Grading Queue

// TODO: Update/Fix using nonce

const deleteGradingJob = async (sub_id: string) => {
  const grading_job_to_delete = await client.get(`QueuedGradingInfo.${sub_id}`);
  if (!grading_job_to_delete) {
    // error - grading job not found in queue
    return -1;
  }
  const grading_job = JSON.parse(grading_job_to_delete);
  // Delete QueuedGradingInfo entry
  client.del(`QueuedGradingInfo.${sub_id}`);

  if (grading_job["user_id"] || grading_job["team_id"]) {
    // Delete submission from SubmitterInfo list
    const submitter_info_str = grading_job["user_id"]
      ? `user.${grading_job["user_id"]}`
      : `team.${grading_job["team_id"]}`;
    client.lRem(`SubmitterInfo.${submitter_info_str}`, 1, sub_id);
  }

  // TODO: Handle GradingQueue
  return 1;
};

export default deleteGradingJob;
