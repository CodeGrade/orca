import Ajv from "ajv";
import { JTDDataType } from "ajv/dist/core";

const fileInfo = {
  $id: "https://orca-schemas.com/grading-job-config/file-info",
  type: "object",
  properties: {
    url: { type: "string" },
    mime_type: { type: "string" },
    should_replace_paths: { type: "boolean" },
  },
};

const bashGradingScriptCommand = {
  $id: "https://orca-schemas.com/grading-job-config/bash-grading-script-command",
  type: "object",
  properties: {
    cmd: {
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    on_complete: {
      anyOf: [
        { $ref: "grading-job-config/grading-script-command" },
        { type: "string" },
        { type: "number" },
      ],
    },
    on_fail: {
      anyOf: [
        { $ref: "grading-job-config/grading-script-command" },
        { type: "string" },
        { type: "number" },
      ],
    },
    label: { type: "string" },
    working_dir: { type: "string" },
  },
  required: ["cmd"],
};

const gradingScriptCondition = {
  $id: "https://orca-schemas.com/grading-job-config/grading-script-condition",
  type: "object",
  properties: {
    path: { type: "string" },
    predicate: { type: "string", enum: ["exists", "file", "dir"] },
  },
};

const conditionalGradingScriptCommand = {
  $id: "https://orca-schemas.com/grading-job-config/conditional-grading-script-command",
  properties: {
    condition: { $ref: "grading-script-condition" },
    on_true: {
      anyOf: [
        { $ref: "grading-job-config/grading-script-command" },
        { type: "string" },
        { type: "number" },
      ],
    },
    on_false: {
      anyOf: [
        { $ref: "grading-job-config/grading-script-command" },
        { type: "string" },
        { type: "number" },
      ],
    },
    label: { type: "string" },
  },
  required: ["condition"],
};

const gradingScriptCommand = {
  $id: "https://orca-schemas.com/grading-job-config/grading-script-command",
  $recursiveAnchor: true,
  oneOf: [
    { $ref: "grading-job-config/bash-grading-script-command" },
    { $ref: "grading-job-config/conditional-grading-script-command" },
  ],
};

export const gradingJobConfigSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    collation: { $ref: "shared/collation" },
    metadata_table: {
      type: "object",
      patternProperties: {
        "*": { type: "string" },
      },
    },
    files: {
      type: "object",
      patternProperties: { "*": { $ref: "grading-job-config/file-info" } },
    },
    priority: { type: "number" },
    script: { type: "array", items: { $ref: "grading-script-command" } },
    response_url: { type: "string" },
    grader_image_sha: { type: "string" },
  },
} as const;

export type GradingJobConfig = JTDDataType<typeof gradingJobConfigSchema>;
