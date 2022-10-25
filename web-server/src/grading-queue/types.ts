export type SubmitterInfoData = {
  submitter: string;
  submissions: string[];
};

export type SubmitterInfo = {
  [submitter: string]: string[];
};

export type GradingQueueEntry = {
  value: string;
  score: number;
};

interface GradingScriptCommand {
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

export interface GradingJobConfig {
  key: string; // JSONString
  collation: Collation;
  metadata_table: Map<string, string>;
  files: Map<string, CodeFileInfo>;
  priority: number;
  script: GradingScriptCommand[];
  response_url: string;
}

export interface GradingJob {
  key: string; // JSONString
  collation: Collation;
  metadata_table: Map<string, string>;
  files: Map<string, CodeFileInfo>;
  priority: number;
  script: GradingScriptCommand[];
  response_url: string;
  release_at: number; // Release timestamp in ms
  created_at: number; // Created timestamp in ms
  // updated_at: number; // Last updated timestamp in ms
}

export type PaginationInfo = {
  offset: number;
  limit: number;
};

export type PaginationData = {
  first: PaginationInfo | null;
  last: PaginationInfo | null;
  prev: PaginationInfo | null;
  next: PaginationInfo | null;
  data: GradingJob[];
};

export type TimeStats = {
  avg: number;
  min: number;
  max: number;
  num: number;
};

export type GradingQueueStats = {
  all: TimeStats;
  released: TimeStats;
};

export enum MoveJobAction {
  RELEASE = "release",
  DELAY = "delay",
}

export interface MoveJobRequest {
  nonce: number;
  jobKey: string; // JSONString
  moveAction: MoveJobAction;
  collation?: Collation;
}
