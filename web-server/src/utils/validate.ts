import { GradingJob, GradingJobConfig } from "../grading-queue/types";

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

const validateSubmitterId = (config: any): boolean => {
  // Has both a team and a user id
  if ("team_id" in config && "user_id" in config) return false;
  // Has to have 1
  return "team_id" in config || "user_id" in config;
};

export const validateGradingJobConfig = (
  config: any
): config is GradingJobConfig => {
  if (!validateRequiredFields(config)) return false;
  if (!validateSubmitterId(config)) return false;
  if (!validateScript(config.script)) return false;
  if (!validateOptionalFields(config)) return false;
  return true;
};
