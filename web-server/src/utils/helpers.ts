import {
  redisExpireAt,
  redisExpireTime,
  redisLPush,
  redisSet,
  redisZAdd,
} from "./redis";
import { LIFETIME_BUFFER } from "../grading-queue/constants";
import { GradingJob } from "../grading-queue/types";

export const generateGradingInfoKey = (sub_id: number) => {
  return `QueuedGradingInfo.${sub_id}`;
};

export const calculateLifetime = async (
  grading_info_key: string,
  priority: number
): Promise<[number | null, Error | null]> => {
  const [exp_time, exp_time_err] = await redisExpireTime(grading_info_key);
  if (exp_time_err) return [null, exp_time_err];
  if (!exp_time)
    return [
      null,
      Error(
        "Failed to retrieve expiration time when calculating job lifetime."
      ),
    ];
  const lifetime = Math.max(priority + LIFETIME_BUFFER, exp_time);
  return [lifetime, null];
};

export const setGradingInfo = async (
  grading_info_key: string,
  grading_job_config: GradingJob,
  lifetime: number
): Promise<Error | null> => {
  // Set QueuedGradingInfo
  const [job_set, job_set_err] = await redisSet(
    grading_info_key,
    JSON.stringify(grading_job_config)
  );
  if (job_set_err) return job_set_err;
  if (!job_set)
    return Error("Failed to set queued grading info for professor job.");

  // Set expiration time of QueuedGradingInfo
  const [job_expire_at, job_expire_at_err] = await redisExpireAt(
    grading_info_key,
    lifetime!
  );
  if (job_expire_at_err) return job_expire_at_err;
  if (!job_expire_at)
    return Error("Failed to set professor job expiration time.");
  return null;
};

export const addToGradingQueue = async (
  value: string,
  score: number
): Promise<Error | null> => {
  // should always be 1 - only ever add 1 item at time
  const [gq_set, gq_set_err] = await redisZAdd("GradingQueue", score, value);
  if (gq_set_err) return gq_set_err;
  if (gq_set !== 1) return Error("Failed to add job to grading queue.");
  return null;
};

export const updateGradingQueue = async (
  value: string,
  score: number
): Promise<Error | null> => {
  // gq_set should always be 0 since we are updating existing element, not adding new
  const [gq_set, gq_set_err] = await redisZAdd("GradingQueue", score, value);
  if (gq_set_err) return gq_set_err;
  if (gq_set !== 0) return Error("Failed to update grading queue.");
  return null;
};

export const getNextTaskString = (grading_job_config: GradingJob): string => {
  let next_task: string = "";
  // Determine if job has user_id or team_id for redis keys
  if (grading_job_config["user_id"]) {
    const user_id = grading_job_config["user_id"];
    next_task = `user.${user_id}`;
  } else {
    // Team id
    const team_id = grading_job_config["team_id"];
    next_task = `team.${team_id}`;
  }
  return next_task;
};

export const setSubmitterInfo = async (
  submitter_str: string,
  sub_id: number,
  lifetime: number
): Promise<Error | null> => {
  // Add submission id to SubmitterInfo list
  const submitter_info_key = `SubmitterInfo.${submitter_str}`;
  const [sub_info, sub_info_err] = await redisLPush(
    submitter_info_key,
    `${sub_id}`
  );
  if (sub_info_err) return sub_info_err;
  if (!sub_info)
    return Error(
      "Failed to push submission id to corresponding submitter info list."
    );

  // Set expiration time of SubmitterInfo list
  const [sub_info_expire_at, sub_info_expire_at_err] = await redisExpireAt(
    submitter_info_key,
    lifetime!
  );
  if (sub_info_expire_at_err) return sub_info_expire_at_err;
  if (!sub_info_expire_at)
    return Error("Failed to set submitter info expiration time.");
  return null;
};

export const filterNull = (arr: any[]): any[] => {
  return arr.filter((x) => x);
};
