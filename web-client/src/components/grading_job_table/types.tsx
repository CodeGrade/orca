type GradingScriptCommand = {
  cmd: string;
  on_fail: string;
  on_complete: string;
};

export interface GradingJob {
  created_at: number;
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  starter_code?: string; // CodeFileInfo;
  student_code: string; // CodeFileInfo;
  professor_code?: string; // CodeFileInfo;
  priority: number;
  max_retries?: number;
  script: [GradingScriptCommand];
  team_id?: number;
  user_id?: number;
  user_names?: string[];
  submitter_name: string;
  nonce: string; // Used for redis operations
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

export type GradingQueue = {
  grading_jobs: GradingJob[];
  prev: PaginationInfo | null;
  next: PaginationInfo | null;
  total: number;
  stats: GradingQueueStats;
};

export type State = {
  grading_queue: GradingQueue;
};
