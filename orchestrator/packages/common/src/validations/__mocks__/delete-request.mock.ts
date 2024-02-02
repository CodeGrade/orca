import { DeleteJobRequest } from "../../types/grading-queue";

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
