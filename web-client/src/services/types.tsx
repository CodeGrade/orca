import { Collation } from "../components/grading_job_table/types";

export type DeleteJobRequest = {
  jobKey: string;
  collation?: Collation;
  nonce?: number;
};

export enum MoveJobAction {
  RELEASE = "release",
  DELAY = "delay",
}

export interface MoveJobRequest {
  nonce: number;
  jobKey: string; // JSONstring
  moveAction: MoveJobAction;
  collation: Collation;
}
