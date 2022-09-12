export type SubmitterInfoObj = {
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

export interface GradingJob {
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
  user_names?: [string];
  submitter_name: string;
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
  prev: PaginationInfo | null;
  next: PaginationInfo | null;
  data: GradingJob[];
};
