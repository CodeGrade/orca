export type GradingScriptCommand = {
  cmd: string;
  on_fail: string;
  on_complete: string;
};

export interface GradingJob {
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  starter_code?: string; // CodeFileInfo;
  student_code: string; // CodeFileInfo;
  professor_code?: string; // CodeFileInfo;
  max_retries?: number;
  script: [GradingScriptCommand];
  team_id?: number;
  user_id?: number;
  user_names?: string[];
  submitter_name: string;
  release_at: number; // release timestamp in ms
  created_at: number; // created at timestamp in ms
  nonce: string;
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

export type GradingQueueStats = {
  all: TimeStats;
  released: TimeStats;
};

export type FilterInfo = {
  course_id: string[];
  grader_id: string[];
};

export type GradingQueue = {
  grading_jobs: GradingJob[];
  first: PaginationInfo | null;
  last: PaginationInfo | null;
  prev: PaginationInfo | null;
  next: PaginationInfo | null;
  total: number;
  stats: GradingQueueStats;
  filter_info: FilterInfo;
};

export type State = {
  grading_queue: GradingQueue;
};
