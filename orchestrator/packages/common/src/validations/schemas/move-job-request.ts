export const moveJobRequestSchema = {
  $id: "https://orca-schemas.com/move-job-request",
  type: "object",
  properties: {
    jobID: { type: "number" },
    moveAction: { enum: ["delay", "release"] },
  },
} as const;
