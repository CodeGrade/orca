import { JTDDataType } from "ajv/dist/core";

export const moveJobRequestSchema = {
  type: "object",
  properties: {
    nonce: { type: "number" },
    orcaKey: { type: "string" },
    moveAction: { enum: ["delay", "release"] },
    collation: { $ref: "shared/collation" },
  },
} as const;

export type MoveJobRequest = JTDDataType<typeof moveJobRequestSchema>;
