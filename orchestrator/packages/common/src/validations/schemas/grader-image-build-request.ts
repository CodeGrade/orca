export const graderImageBuildRequestSchema = {
  $id: "https://orca-schemas.com/grader-image-build-request",
  type: "object",
  properties: {
    dockerfileContents: { type: "string" },
    dockerfileSHASum: { type: "string" },
    responseURL: { type: "string" }
  },
} as const;
