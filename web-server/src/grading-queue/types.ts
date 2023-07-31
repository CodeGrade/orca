export interface Reservation {
  value: string;
  score: number;
}

interface GradingScriptCommand {
  cmd: string;
  on_fail: "abort" | number;
  on_complete: "output" | number;
}

export interface CodeFileInfo {
  url: string;
  mime_type: string;
}

export type CollationType = "team" | "user";

export interface Collation {
  type: CollationType;
  id: string;
}

export interface GradingJob {
  key: string; // JSONString
  collation: Collation;
  metadata_table: Map<string, string | string[]>;
  files: Map<string, CodeFileInfo>;
  priority: number;
  script: GradingScriptCommand[];
  response_url: string;
}

interface AdditionalJobData {
  release_at: number;
  created_at: number;
  orca_key: string;
}

export type EnrichedGradingJob = GradingJob & AdditionalJobData;

export interface PaginationInfo {
  offset: number;
  limit: number;
}

export interface PaginationData {
  first?: PaginationInfo;
  last?: PaginationInfo;
  prev?: PaginationInfo;
  next?: PaginationInfo;
  data: EnrichedGradingJob[];
}

export interface TimeStats {
  avg: number;
  min: number;
  max: number;
  num: number;
}

export interface GradingQueueStats {
  all: TimeStats;
  released: TimeStats;
}

export enum MoveJobAction {
  RELEASE = "release",
  DELAY = "delay",
}

export interface MoveJobRequest {
  nonce: number;
  jobKey: string; // JSONString
  moveAction: MoveJobAction;
  collation: Collation;
}

export interface DeleteJobRequest {
  jobKey: string; // JSONString
  nonce: number;
  collation?: Collation;
}

export interface FilterInfo {
  [type: string]: string[];
}

export enum FilterType {
  CourseID = "course_id",
  GraderID = "grader_id",
}
