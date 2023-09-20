import { JTDDataType } from "ajv/dist/core";

export const deleteJobRequestSchema = {
  type: "object",
  properties: {
    orcaKey: { type: "string" },
    collation: { $ref: "shared/collation" },
    nonce: { type: "number" },
  },
  required: ["orcaKey"],
} as const;

export type DeleteJobRequest = JTDDataType<typeof deleteJobRequestSchema>;
