import { GradingJobProps } from "../components/reducers/grading-job-reducer";

export const getTimeInQueue = (created_at: number): number => {
  const now: number = new Date().getTime() / 1000; // in seconds
  const duration_timestamp: number = now - created_at;
  return duration_timestamp;
};

export const getTimeUntilRelease = (release_time: number): number => {
  const now: number = new Date().getTime() / 1000; // in seconds
  const remaining_timestamp: number = release_time - now;
  return remaining_timestamp;
};

export type WaitTimeStats = {
  avg: number;
  min: number;
  max: number;
};

export const getWaitTimesOfQueue = (
  grading_job_queue: GradingJobProps[]
): WaitTimeStats => {
  let wait_times: number[] = [];
  grading_job_queue.map((grading_job: GradingJobProps) => {
    wait_times.push(getTimeInQueue(grading_job.created_at));
  });
  const avg_wait = wait_times.reduce((a, b) => a + b, 0) / wait_times.length;
  const min_wait = Math.min(...wait_times);
  const max_wait = Math.max(...wait_times);
  return {
    avg: avg_wait,
    min: min_wait,
    max: max_wait,
  };
};
