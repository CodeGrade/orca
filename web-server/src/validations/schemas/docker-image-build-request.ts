export const dockerImageBuildRequestSchema = {
  $id: "https://orca-schemas.com/docker-image-build-request",
  type: "object",
  properties: {
    shaSum: { type: "string" },
    dockerfileContents: { type: "string" },
  },
} as const;
