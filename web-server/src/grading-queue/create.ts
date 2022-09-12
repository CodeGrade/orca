import { client } from "../index";
import { GradingJob } from "./types";
import { LIFETIME_BUFFER } from "./constants";

const createGradingJob = async (grading_job_config: GradingJob) => {
  // TODO: Check if valid using GradingJob interface

  const sub_id = grading_job_config["submission_id"];
  const priority = grading_job_config["priority"];

  const lifetime = Math.max(
    priority + LIFETIME_BUFFER,
    await client.expireTime(`QueuedGradingInfo.${sub_id}`)
  );

  await client.set(
    `QueuedGradingInfo.${sub_id}`,
    JSON.stringify(grading_job_config)
  );
  client.expireAt(`QueuedGradingInfo.${sub_id}`, lifetime);

  let next_task: string = "";

  // Submission timestamp nonce to add at end of GradingQueue entry key string
  const now = new Date().getTime();

  if (grading_job_config["user_id"]) {
    const user_id = grading_job_config["user_id"];
    next_task = `user.${user_id}`;
  } else if (grading_job_config["team_id"]) {
    const team_id = grading_job_config["team_id"];
    next_task = `team.${team_id}`;
  } else {
    client.zAdd("GradingQueue", [
      { score: priority, value: `sub.${sub_id}.${now}` },
    ]);
    return 1;
  }

  if (
    (await client.exists(`SubmitterInfo.${next_task}`)) &&
    (await client.lPos(`SubmitterInfo.${next_task}`, `${sub_id}`)) !== null
  ) {
    // Duplicate - Submission ID already exists in SubmitterInfo
    return 0;
  }

  await client.lPush(`SubmitterInfo.${next_task}`, `${sub_id}`);
  await client.expireAt(`SubmitterInfo.${next_task}`, lifetime);
  await client.zAdd("GradingQueue", [
    { score: priority, value: `${next_task}.${now}` },
  ]);
  return 1;
};

export default createGradingJob;
