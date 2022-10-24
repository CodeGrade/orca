import {
  CodeFileInfo,
  Collation,
  CollationType,
  GradingJob,
  GradingJobConfig,
} from "../grading-queue/types";

const isNumber = (value: any): boolean => typeof value === "number";
const isInteger = (value: any): boolean => Number.isInteger(value);
const isString = (value: any): boolean => typeof value === "string";
const isObject = (value: any): boolean => typeof value === "object";
const isArray = (value: any): boolean => Array.isArray(value);

// Key must not contain '.' character
const validateJSONKey = (key: string) => {
  return key.indexOf(".") === -1;
};

const validateRequiredFields = (config: any): boolean => {
  const fields =
    "key" in config &&
    "collation" in config &&
    "metadata_table" in config &&
    "files" in config &&
    "priority" in config &&
    "script" in config &&
    "response_url" in config;
  if (!fields) return false;

  const types =
    isString(config.key) &&
    isObject(config.collation) &&
    isObject(config.metadata_table) &&
    isObject(config.files) &&
    isInteger(config.priority) &&
    isArray(config.script) &&
    isString(config.response_url);
  if (!types) return false;
  return true;
};

const validateScript = (script: any[]): boolean => {
  if (!script.every((cmd) => isObject(cmd))) return false;
  if (
    !script.every((cmd) => {
      const cmd_fields =
        "cmd" in cmd && "on_fail" in cmd && "on_complete" in cmd;
      if (!cmd_fields) return false;
      const cmd_types =
        isString(cmd.cmd) &&
        isInteger(cmd.on_fail) &&
        isInteger(cmd.on_complete);
      if (!cmd_types) return false;
      return true;
    })
  )
    return false;
  return true;
};

// TODO: What to type collation as?
const validateCollation = (collation: any): collation is Collation => {
  const fields = "type" in collation && "id" in collation;
  if (!fields) return false;

  const types = isString(collation.type) && isString(collation.id);
  if (!types) return false;

  const validateCollationType = (type: string): type is CollationType => {
    return type in Object.values(CollationType);
  };

  const collation_type = validateCollationType(collation.type);
  if (!collation_type) return false;
  return true;
};

// TODO: What to type files as
const validateFiles = (files: object) => {
  const validateCodeFileInfo = (file_info: any): file_info is CodeFileInfo => {
    const fields = "url" in file_info && "mime_type" in file_info;
    if (!fields) return false;
    const types = isString(file_info.url) && isString(file_info.mime_type);
    if (!types) return false;
    return true;
  };

  for (const [key, file_info] of Object.entries(files)) {
    if (!isString(key)) return false;
    if (!validateCodeFileInfo(file_info)) return false;
  }
  return true;
};

// TODO: What to type metadata_table as
const validateMetadataTable = (metadata_table: object) => {
  for (const [key, value] of Object.entries(metadata_table)) {
    if (!isString(key)) return false;
    if (!isString(value)) return false;
  }
  return true;
};

// TODO: Pull these out as separate middleware validation checks?
export const validateGradingJobConfig = (
  config: any,
): config is GradingJobConfig => {
  if (!validateRequiredFields(config)) return false;
  if (!validateJSONKey(config.key)) return false;
  if (!validateCollation(config.collation)) return false;
  if (!validateFiles(config.files)) return false;
  if (!validateScript(config.script)) return false;
  if (!validateMetadataTable(config.metadata_table)) return false;
  return true;
};
