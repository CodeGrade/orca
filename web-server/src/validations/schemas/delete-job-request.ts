export const deleteJobRequestSchema = {
  $id: "https://orca-schemas.com/delete-job-request",
  type: "object",
  properties: {
    orcaKey: { type: "string" },
    collation: { $ref: "https://orca-schemas.com/shared/collation" },
    nonce: { type: "number" },
  },
  required: ["orcaKey"],
} as const;
