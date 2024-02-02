export const moveJobRequestSchema = {
  $id: "https://orca-schemas.com/move-job-request",
  type: "object",
  properties: {
    nonce: { type: "string" },
    orcaKey: { type: "string" },
    moveAction: { enum: ["delay", "release"] },
    collation: { $ref: "https://orca-schemas.com/shared/collation" },
  },
} as const;
