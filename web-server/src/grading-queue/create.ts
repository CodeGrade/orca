import { client } from "../index";
import { GradingJob } from "./types";
import { LIFETIME_BUFFER } from "./constants";

const isNumber = (value: any): boolean => typeof value === "number";
const isString = (value: any): boolean => typeof value === "string";
const isObject = (value: any): boolean => typeof value === "object";
const isArray = (value: any): boolean => Array.isArray(value);

const validateRequiredFields = (config: any): boolean => {
  const fields =
    "submission_id" in config &&
    "grade_id" in config &&
    "grader_id" in config &&
    "course_id" in config &&
    "student_code" in config &&
    "priority" in config &&
    "script" in config &&
    "submitter_name" in config;
  if (!fields) return false;

  const types =
    isNumber(config.submission_id) &&
    isNumber(config.grade_id) &&
    isNumber(config.grader_id) &&
    isNumber(config.course_id) &&
    isString(config.student_code) &&
    isNumber(config.priority) &&
    isString(config.submitter_name) &&
    isArray(config.script);
  if (!types) return false;
  return true;
};

const validateScript = (script: any): boolean => {
  if (!script.every((cmd) => isObject(cmd))) return false;
  if (
    !script.every((cmd) => {
      const cmd_fields =
        "cmd" in cmd && "on_fail" in cmd && "on_complete" in cmd;
      if (!cmd_fields) return false;
      const cmd_types =
        isString(cmd.cmd) && isString(cmd.on_fail) && isString(cmd.on_complete);
      if (!cmd_types) return false;
      return true;
    })
  )
    return false;
  return true;
};

const validateOptionalFields = (config: any): boolean => {
  if ("starter_code" in config && !isString(config.starter_code)) return false;
  if ("professor_code" in config && !isString(config.professor_code))
    return false;
  if ("max_retries" in config && !isNumber(config.max_retries)) return false;
  if ("team_id" in config && !isNumber(config.team_id)) return false;
  if ("user_id" in config && !isNumber(config.user_id)) return false;
  if ("user_names" in config) {
    if (!isArray(config.user_names)) return false;
    if (!config.user_names.every((user_name) => isString(user_name)))
      return false;
  }
  return true;
};

const validateGradingJobConfig = (config: any): config is GradingJob => {
  if (!validateRequiredFields(config)) return false;
  if ("team_id" in config && "user_id" in config) return false;
  if (!validateScript(config.script)) return false;
  if (!validateOptionalFields(config)) return false;
  return true;
};

const createGradingJob = async (grading_job_config: any) => {
  if (!validateGradingJobConfig(grading_job_config)) {
    return 400;
  }

  const now = new Date().getTime();

  const sub_id = grading_job_config["submission_id"];
  // priority field is a delay in ms
  const priority = now + grading_job_config["priority"];
  const grading_info_key = `QueuedGradingInfo.${sub_id}`;

  // TODO: Swap redis operations to use the helpers? Depends if we care about knowing which specific operation failed?
  try {
    const lifetime = Math.max(
      priority + LIFETIME_BUFFER,
      await client.expireTime(grading_info_key)
    );

    // TODO: Should I do this? Do we care about having the original delay submitted or do
    // we now just care when the job is released?
    grading_job_config.priority = priority;
    await client.set(grading_info_key, JSON.stringify(grading_job_config));
    await client.expireAt(grading_info_key, lifetime);

    let next_task: string = "";

    if (grading_job_config["user_id"]) {
      const user_id = grading_job_config["user_id"];
      next_task = `user.${user_id}`;
    } else if (grading_job_config["team_id"]) {
      const team_id = grading_job_config["team_id"];
      next_task = `team.${team_id}`;
    } else {
      // Jobs with just sub id go to priority now (lowest delay) - professor requests (assuming this is given correctly)
      await client.zAdd("GradingQueue", [
        { score: priority, value: `sub.${sub_id}.${now}` },
      ]);
      return 200;
    }
    const submitter_info_key = `SubmitterInfo.${next_task}`;
    await client.lPush(submitter_info_key, `${sub_id}`);
    await client.expireAt(submitter_info_key, lifetime);
    await client.zAdd("GradingQueue", [
      { score: priority, value: `${next_task}.${now}` },
    ]);
    return 200;
  } catch (error) {
    return 500;
  }
};

export default createGradingJob;
