export interface Reservation {
  value: string;
  score: number;
}

type GradingScriptCommand =
  | BashGradingScriptCommand
  | ConditionalGradingScriptCommand;

interface ConditionalGradingScriptCommand {
  condition: GradingScriptCondition;
  on_true?: GradingScriptCommandEdge;
  on_false?: GradingScriptCommandEdge;
}

interface GradingScriptCondition {
  predicate: "exists" | "dir" | "file";
  path: string;
}

interface BashGradingScriptCommand {
  cmd: string | Array<string>;
  on_fail?: "abort" | GradingScriptCommandEdge;
  on_complete?: "output" | GradingScriptCommandEdge;
  replace_paths?: boolean;
  working_dir?: string;
}

type GradingScriptCommandEdge = number | string | GradingScriptCommand;

export interface FileInfo {
  url: string;
  mime_type: string;
  should_replace_paths: boolean;
}

export type CollationType = "team" | "user";

export type GradingScript = GradingScriptCommand[];

export interface Collation {
  type: CollationType;
  id: string;
}

export interface GradingJobConfig {
  key: string; // JSONString
  collation: Collation;
  metadata_table: Record<string, string | string[]>;
  files: Record<string, FileInfo>;
  priority: number;
  script: GradingScript;
  response_url: string;
  container_response_url?: string;
  grader_image_sha: string;
}

interface AdditionalJobData {
  release_at: Date;
  created_at: Date;
  queue_id: number;
}

export type GradingJob = GradingJobConfig & AdditionalJobData;

export interface PaginationInfo {
  offset: number;
  limit: number;
}

export interface PaginationData {
  first?: PaginationInfo;
  last?: PaginationInfo;
  prev?: PaginationInfo;
  next?: PaginationInfo;
  data: GradingJob[];
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

export type MoveJobAction = "release" | "delay";

export interface MoveJobRequest {
  jobID: number;
  moveAction: MoveJobAction;
}

export interface FilterInfo {
  [type: string]: string[];
}

export enum FilterType {
  CourseID = "course_id",
  GraderID = "grader_id",
}
