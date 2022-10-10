export type SubmitterInfoData = {
  submitter: string;
  submissions: string[];
};

export type SubmitterInfo = {
  [submitter: string]: string[];
};

type GradingScriptCommand = {
  cmd: string;
  on_fail: string;
  on_complete: string;
};

export type GradingQueueEntry = {
  value: string;
  score: number;
};

export interface GradingJobConfig {
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  starter_code?: string; // CodeFileInfo;
  student_code: string; // CodeFileInfo;
  professor_code?: string; // CodeFileInfo;
  priority: number; // Delay in ms
  max_retries?: number;
  script: GradingScriptCommand[];
  team_id?: number;
  user_id?: number;
  user_names?: string[];
  submitter_name: string;
}

export interface GradingJob {
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  starter_code?: string; // CodeFileInfo;
  student_code: string; // CodeFileInfo;
  professor_code?: string; // CodeFileInfo;
  max_retries?: number;
  script: GradingScriptCommand[];
  team_id?: number;
  user_id?: number;
  user_names?: string[];
  submitter_name: string;
  release_at: number; // Release timestamp in ms
  created_at: number; // Created timestamp in ms
}

export type MoveConfig = {
  priority: string;
  nonce: string;
  team_id?: string;
  user_id?: string;
};

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
