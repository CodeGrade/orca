import { Collation, FilterInfo } from "../components/grading_job_table/types";

export interface DeleteJobRequest {
  jobKey: string;
  collation?: Collation;
  nonce?: number;
}

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

export interface GetJobsParams {
  limit: number;
  offset: number;
  filters?: FilterInfo;
}
