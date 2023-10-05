export const deleteJobRequestSchema = {
  $id: "https://orca-schemas.com/delete-job-request",
  type: "object",
  properties: {
    orcaKey: { type: "string" },
    collation: { $ref: "https://orca-schemas.com/shared/collation" },
    arrivalTime: { type: "number" },
  },
  required: ["orcaKey"],
} as const;
