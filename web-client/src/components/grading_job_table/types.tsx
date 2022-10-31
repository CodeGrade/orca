export interface GradingScriptCommand {
  cmd: string;
  on_fail: "abort" | number;
  on_complete: "output" | number;
}

export interface CodeFileInfo {
  url: string;
  mime_type: string;
}

export enum CollationType {
  User = "user",
  Team = "team",
}

export interface Collation {
  type: CollationType;
  id: string;
}

export interface GradingJob {
  key: string; // JSONString
  collation: Collation;
  metadata_table: {
    /* Map<string, string | string[]>; */
    [property: string]: string | string[];
  };
  files: Map<string, CodeFileInfo>;
  priority: number;
  script: GradingScriptCommand[];
  response_url: string;
  nonce: string | null;
  release_at: number; // Release timestamp in ms
  created_at: number; // Created timestamp in ms
  // updated_at: number; // Last updated timestamp in ms
}

export type PaginationInfo = {
  limit: number;
  offset: number;
};

export type TimeStats = {
  avg: number;
  min: number;
  max: number;
  num: number;
};

export type GradingJobStats = {
  all: TimeStats;
  released: TimeStats;
};

export type FilterInfo = {
  course_id: string[];
  grader_id: string[];
};

export type GradingJobTableInfo = {
  grading_jobs: GradingJob[];
  first: PaginationInfo | null;
  last: PaginationInfo | null;
  prev: PaginationInfo | null;
  next: PaginationInfo | null;
  total: number;
  stats: GradingJobStats;
  filter_info: FilterInfo;
};

export type State = {
  grading_table_info: GradingJobTableInfo;
};

export enum SortType {
  RELEASE_AT = "release_at",
  WAIT_TIME = "created_at",
  GRADER_ID = "grader_id",
  COURSE_ID = "course_id",
  SUBMITTER_NAME = "submitter_name",
}
