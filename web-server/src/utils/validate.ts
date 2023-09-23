import {
  CodeFileInfo,
  Collation,
  CollationType,
  DeleteJobRequest,
  GradingJob,
  MoveJobAction,
  MoveJobRequest,
} from "../grading-queue/types";

const isNumber = (value: any): boolean => typeof value === "number";
const isInteger = (value: any): boolean => Number.isInteger(value);
const isString = (value: any): boolean => typeof value === "string";
const isObject = (value: any): boolean => typeof value === "object";
const isArray = (value: any): boolean => Array.isArray(value);
const isStringArray = (arr: any): boolean => {
  if (!isArray(arr)) return false;
  return arr.every((elem) => isString(elem));
};

// Key must not contain '.' character
const validateJSONKey = (key: string) => {
  return key.indexOf(".") === -1;
};

// TODO: Add conditional commands, recursive checking, etc.
const validateScript = (script: any[]): boolean => {
  const validateOnFail = (onFail: any) => {
    return isInteger(onFail) || onFail === "abort";
  };
  const validateOnComplete = (onComplete: any) => {
    return isInteger(onComplete) || onComplete === "output";
  };
  return script.every((cmd) => {
    if (!isObject(cmd)) return false;

    const validCmdValue =
      "cmd" in cmd &&
      (isString(cmd.cmd) ||
        (isArray(cmd.cmd) && cmd.cmd.every((m) => isString(m))));

    const cmdTypes =
      validCmdValue &&
      ("on_complete" in cmd ? validateOnComplete(cmd.on_complete) : true) &&
      ("on_fail" in cmd ? validateOnFail(cmd.on_fail) : true);

    return cmdTypes;
  });
};

// TODO: What to type collation as?
const validateCollation = (collation: any): collation is Collation => {
  if (!collation) return false;

  const fields = "type" in collation && "id" in collation;

  if (!fields) return false;

  const types = isString(collation.type) && isString(collation.id);

  if (!types) return false;

  const validateCollationType = (type: string): type is CollationType => {
    return type === "team" || type === "user";
  };

  return validateCollationType(collation.type);
};

const validateFiles = (files: object) => {
  const validateCodeFileInfo = (fileInfo: any): fileInfo is CodeFileInfo => {
    const fields = "url" in fileInfo && "mime_type" in fileInfo;
    if (!fields) return false;
    const types = isString(fileInfo.url) && isString(fileInfo.mime_type);
    if (!types) return false;
    return true;
  };

  for (const [key, fileInfo] of Object.entries(files)) {
    if (!isString(key)) return false;
    if (!validateCodeFileInfo(fileInfo)) return false;
  }
  return true;
};

const validateMetadataTable = (metadataTable: object) => {
  for (const [key, value] of Object.entries(metadataTable)) {
    if (!isString(key)) return false;
    if (!isString(value) && !isStringArray(value)) return false;
  }
  return true;
};

// TODO: Pull these out as separate middleware validation checks?
export const validateGradingJob = (config: any): config is GradingJob => {
  const validateGradingJobFields = (config: any): boolean => {
    const fields =
      "key" in config &&
      "collation" in config &&
      "metadata_table" in config &&
      "files" in config &&
      "priority" in config &&
      "script" in config &&
      "response_url" in config &&
      "grader_image_sha" in config;
    if (!fields) return false;

    const types =
      isString(config.key) &&
      isObject(config.collation) &&
      isObject(config.metadata_table) &&
      isObject(config.files) &&
      isInteger(config.priority) &&
      isArray(config.script) &&
      isString(config.response_url) &&
      isString(config.grader_image_sha);
    if (!types) return false;
    return true;
  };

  if (!validateGradingJobFields(config)) return false;

  if (!validateJSONKey(config.key)) return false;

  if (!validateCollation(config.collation)) return false;

  if (!validateFiles(config.files)) return false;

  if (!validateScript(config.script)) return false;

  if (!validateMetadataTable(config.metadata_table)) return false;

  return true;
};

export const validateMoveRequest = (
  request: any,
): request is MoveJobRequest => {
  const validateMoveRequestFields = (request: any): boolean => {
    if (!isObject(request)) return false;
    const fields =
      "nonce" in request &&
      "jobKey" in request &&
      "moveAction" in request &&
      "collation" in request;
    if (!fields) return false;

    const types = isNumber(request.nonce) && isString(request.jobKey);
    if (!types) return false;
    return (
      validateCollation(request.collation) &&
      validateMoveAction(request.moveAction)
    );
  };

  const validateMoveAction = (
    moveAction: string,
  ): moveAction is MoveJobAction => {
    if (!moveAction) {
      return false;
    }
    return moveAction === "delay" || moveAction === "release";
  };

  if (!validateMoveRequestFields(request)) return false;
  if (!validateJSONKey(request.jobKey)) return false;
  if (!validateCollation(request.collation)) return false;
  if (!validateMoveAction(request.moveAction)) return false;
  return true;
};

export const validateDeleteRequest = (
  request: any,
): request is DeleteJobRequest => {
  const validateDeleteRequestFields = (request: any): boolean => {
    const requiredFields = "orcaKey" in request;
    if (!requiredFields) return false;
    const requiredFieldTypes = isString(request.orcaKey);
    if (!requiredFieldTypes) return false;

    if ("collation" in request && "nonce" in request) {
      return validateCollation(request.collation) && isNumber(request.nonce);
    }
    return true;
  };

  if (!validateDeleteRequestFields(request)) return false;
  if (!validateJSONKey(request.orcaKey)) return false;

  return true;
};

// TODO: Implement filterType as FilterType
export const validateFilterRequest = (filterType: any, filterValue: any) => {
  const types = isString(filterType) && isString(filterValue);
  if (!types) return false;
  return true;
};
