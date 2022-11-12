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

export type PageInfo = {
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
  [filter_by: string]: string[];
};
export type FilterSettings = {
  and: boolean;
};

export type SortInfo = {
  type: SortType;
  asc: boolean; // Ascending
};

export type PaginationInfo = {
  first: PageInfo | null;
  last: PageInfo | null;
  prev: PageInfo | null;
  next: PageInfo | null;
};

// TODO: Implement PaginationInfo type here
export type GradingJobTableInfo = {
  grading_jobs: GradingJob[];
  first: PageInfo | null;
  last: PageInfo | null;
  prev: PageInfo | null;
  next: PageInfo | null;
  total: number;
  stats: GradingJobStats;
  filter_info: FilterInfo;
};

export type State = {
  grading_table_info: GradingJobTableInfo;
};

// TODO: Replace this by object that is generated based on columns currently being displayed
export enum SortType {
  RELEASE_AT = "release_at",
  WAIT_TIME = "created_at",
  GRADER_ID = "grader_id",
  COURSE_ID = "course_id",
  SUBMITTER_NAME = "submitter_name",
}

export type ColumnInfo = {
  label: string;
  prop: string; // Corresponding GradingJob property
  sortType?: SortType;
};
