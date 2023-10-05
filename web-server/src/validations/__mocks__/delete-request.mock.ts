import { DeleteJobRequest } from "../../grading-queue/types";

export const validImmediateDeleteRequest: DeleteJobRequest = {
  orcaKey: "orca-key",
};

export const validDeleteRequest: DeleteJobRequest = {
  ...validImmediateDeleteRequest,
  arrivalTime: 12345,
  collation: {
    type: "user",
    id: "12345",
  },
};
