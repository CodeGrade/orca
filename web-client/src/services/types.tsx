import { Collation } from "../components/grading_job_table/types";

export type DeleteJobConfig = {
  jobKey: string;
  collation?: Collation;
  nonce?: string;
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
