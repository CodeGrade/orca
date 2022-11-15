import { Collation } from "../components/grading_job_table/types";

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

// TODO: Implement filter types
export enum FilterType {
  COURSE_ID = "course_id",
  GRADER_ID = "grader_id",
}
