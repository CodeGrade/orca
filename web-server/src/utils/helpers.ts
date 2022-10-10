import {
  redisExpireAt,
  redisExpireTime,
  redisGet,
  redisKeys,
  redisLPush,
  redisLRange,
  redisSet,
  redisZAdd,
} from "./redis";
import { LIFETIME_BUFFER } from "../grading-queue/constants";
import { GradingJob, GradingJobConfig } from "../grading-queue/types";

// TODO: Custom redis transactions where appropriate

export const generateGradingInfoKey = (sub_id: number) => {
  return `QueuedGradingInfo.${sub_id}`;
};

export const formatGradingJob = (
  grading_job_config: GradingJobConfig,
  release_at: number,
  created_at: number
): GradingJob => {
  const { priority, ...format_grading_job } = grading_job_config;
  return {
    ...format_grading_job,
    release_at: release_at,
    created_at: created_at,
  };
};

export const calculateLifetime = async (
  grading_info_key: string,
  release_at: number
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
  const lifetime = Math.max(release_at + LIFETIME_BUFFER, exp_time);
  return [lifetime, null];
};

export const setGradingInfoWithLifetime = async (
  grading_info_key: string,
  grading_job: GradingJob,
  lifetime: number
): Promise<Error | null> => {
  // Set QueuedGradingInfo
  const [job_set, job_set_err] = await redisSet(
    grading_info_key,
    JSON.stringify(grading_job)
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

export const getSubmitterString = (
  grading_job: GradingJob | GradingJobConfig
): string => {
  let submitter_str: string = "";
  // Determine if job has user_id or team_id for redis keys
  if (grading_job.user_id) {
    const user_id = grading_job.user_id;
    submitter_str = `user.${user_id}`;
  } else {
    // Team id
    const team_id = grading_job.team_id;
    submitter_str = `team.${team_id}`;
  }
  return submitter_str;
};

export const setSubmitterInfoWithLifetime = async (
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

const configMatchesJob = (
  config: GradingJobConfig,
  job: GradingJob
): boolean => {
  // TODO: Not final on the actual fields we need to compare
  const teamOrUserIdAreEqual = () => {
    if (config.team_id) {
      if (!job.team_id || config.team_id !== job.team_id) return false;
    } else if (config.user_id) {
      if (!job.user_id || config.user_id !== job.user_id) return false;
    } else {
      return false;
    }
    return true;
  };
  return (
    config.submission_id === job.submission_id &&
    config.course_id === job.course_id &&
    config.grader_id === job.grader_id &&
    teamOrUserIdAreEqual()
  );
};

export const getSubmitterInfo = async (
  submitter_info_key: string
): Promise<[string[] | null, Error | null]> => {
  const [submitter_info, lrange_err] = await redisLRange(
    submitter_info_key,
    0,
    -1
  );
  if (lrange_err) return [null, lrange_err];
  if (!submitter_info)
    return [
      null,
      Error(
        "Failed to retrieve submitter info for given submitter when moving grading job."
      ),
    ];
  return [submitter_info, null];
};

export const getGradingInfoKeyIfExists = async (
  grading_job_config: GradingJobConfig
): Promise<[string | null, Error | null]> => {
  // Get SubmitterInfo
  const submitter_str = getSubmitterString(grading_job_config);
  const [submitter_info, submitter_info_err] = await getSubmitterInfo(
    `SubmitterInfo.${submitter_str}`
  );
  if (submitter_info_err) return [null, submitter_info_err];
  if (!submitter_info)
    return [null, Error("Failed to retrieve submitter info.")];

  // No existing SubmitterInfo for the team/user
  if (submitter_info.length === 0) return [null, null];

  // Check each submission for match - stop when found
  for (let i = 0; i < submitter_info.length; i++) {
    const submission_id = submitter_info[i];
    const grading_info_key = `QueuedGradingInfo.${submission_id}`;
    const [grading_job_str, get_err] = await redisGet(grading_info_key);
    if (get_err) return [null, get_err];
    if (!grading_job_str) return [null, Error("QueuedGradingInfo not found.")];
    try {
      const grading_job: GradingJob = JSON.parse(grading_job_str);
      if (configMatchesJob(grading_job_config, grading_job)) {
        return [grading_info_key, null];
      }
    } catch (error) {
      return [null, error];
    }
  }
  return [null, null];
};
