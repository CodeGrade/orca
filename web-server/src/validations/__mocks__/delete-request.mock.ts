import { DeleteJobRequest } from "../../grading-queue/types";

export const validImmediateDeleteRequest: DeleteJobRequest = {
  orcaKey: "orca-key",
};

export const validDeleteRequest: DeleteJobRequest = {
  ...validImmediateDeleteRequest,
  nonce: "some-random-uuid",
  collation: {
    type: "user",
    id: "12345",
  },
};
