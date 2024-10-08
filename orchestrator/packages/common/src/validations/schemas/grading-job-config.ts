const fileInfo = {
  $id: "https://orca-schemas.com/grading-job-config/file-info",
  type: "object",
  properties: {
    url: { type: "string" },
    mime_type: { type: "string" },
    should_replace_paths: { type: "boolean" },
  },
  required: [
    'url',
    'mime_type',
    'should_replace_paths'
  ],
  additionalProperties: false,
} as const;

const bashGradingScriptCommandSchema = {
  $id: "https://orca-schemas.com/grading-job-config/bash-grading-script-command",
  type: "object",
  properties: {
    cmd: {
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    on_complete: {
      anyOf: [
        {
          type: "array",
          items: {
            $ref: "https://orca-schemas.com/grading-job-config/grading-script-command",
          }
        },
        { type: "string" },
        { type: "number" },
      ],
    },
    on_fail: {
      anyOf: [
        {
          type: "array",
          items: {
            $ref: "https://orca-schemas.com/grading-job-config/grading-script-command",
          }
        },
        { type: "string" },
        { type: "number" },
      ],
    },
    label: { type: "string" },
    working_dir: { type: "string" },
    timeout: { type: "number" }
  },
  required: ["cmd"],
  additionalProperties: false,
} as const;

const gradingScriptConditionSchema = {
  $id: "https://orca-schemas.com/grading-job-config/grading-script-condition",
  type: "object",
  properties: {
    path: { type: "string" },
    predicate: { type: "string", enum: ["exists", "file", "dir"] },
  },
  required: [
    'path',
    'predicate'
  ],
  additionalProperties: false,
} as const;

const conditionalGradingScriptCommandSchema = {
  $id: "https://orca-schemas.com/grading-job-config/conditional-grading-script-command",
  type: "object",
  properties: {
    condition: { $ref: "grading-script-condition" },
    on_true: {
      anyOf: [
        {
          type: "array",
          items: {
            $ref: "https://orca-schemas.com/grading-job-config/grading-script-command",
          }
        },
        { type: "string" },
        { type: "number" },
      ],
    },
    on_false: {
      anyOf: [
        {
          type: "array",
          items: {
            $ref: "https://orca-schemas.com/grading-job-config/grading-script-command",
          }
        },
        { type: "string" },
        { type: "number" },
      ],
    },
    label: { type: "string" },
  },
  required: ["condition"],
  additionalProperties: false,
} as const;

export const gradingScriptCommandSchema = {
  $id: "https://orca-schemas.com/grading-job-config/grading-script-command",
  oneOf: [
    {
      $ref: "https://orca-schemas.com/grading-job-config/bash-grading-script-command",
    },
    {
      $ref: "https://orca-schemas.com/grading-job-config/conditional-grading-script-command",
    },
  ],
} as const;

export const gradingScriptSubSchemas = [
  bashGradingScriptCommandSchema,
  gradingScriptConditionSchema,
  conditionalGradingScriptCommandSchema,
  gradingScriptCommandSchema
];

export const gradingScriptSchema = {
  $id: "https://orca-schemas.com/grading-job-config/grading-script",
  type: "array",
  items: {
    $ref: "https://orca-schemas.com/grading-job-config/grading-script-command",
  },
} as const;

export const gradingJobConfigSubSchemas = [
  fileInfo,
  ...gradingScriptSubSchemas,
  gradingScriptSchema
];

export const gradingJobConfigSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    collation: { $ref: "https://orca-schemas.com/shared/collation" },
    metadata_table: {
      type: "object",
      patternProperties: {
        ".*": { type: "string" },
      },
    },
    files: {
      type: "object",
      patternProperties: {
        ".*": { $ref: "https://orca-schemas.com/grading-job-config/file-info" },
      },
    },
    priority: { type: "number" },
    script: { $ref: "https://orca-schemas.com/grading-job-config/grading-script" },
    response_url: { type: "string" },
    container_response_url: { type: "string" },
    grader_image_sha: { type: "string" },
  },
  required: [
    "key",
    "collation",
    "metadata_table",
    "files",
    "priority",
    "script",
    "response_url",
    "grader_image_sha",
  ],
  additionalProperties: false,
} as const;
