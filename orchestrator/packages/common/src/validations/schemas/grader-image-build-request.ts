export const graderImageBuildRequestSchema = {
  $id: "https://orca-schemas.com/grader-image-build-request",
  type: "object",
  properties: {
    dockerfile_contents: { type: "string" },
    dockerfile_sha_sum: { type: "string" },
    response_url: { type: "string" },
  },
  required: [
    'dockerfile_contents',
    'dockerfile_sha_sum',
    'response_url'
  ],
  additionalProperties: false,
} as const;
