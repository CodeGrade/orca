import { GradingJob, TimeStats, GradingQueueStats } from "./types";

export const getTimeInQueue = (created_at: number): number => {
  const now: number = new Date().getTime();
  const duration_timestamp: number = now - created_at;
  return duration_timestamp;
};

const calculateTimeStats = (times: number[]): TimeStats => {
  const avg: number = times.reduce((a, b) => a + b, 0) / times.length;
  const min: number = Math.min(...times);
  const max: number = Math.max(...times);
  const num = times.length;
  return {
    avg,
    min,
    max,
    num,
  };
};

export const getGradingQueueStats = (
  grading_job_queue: GradingJob[]
): GradingQueueStats => {
  let wait_times: number[] = [];
  let released_wait_times: number[] = [];
  const now: number = new Date().getTime();
  grading_job_queue.map((grading_job: GradingJob) => {
    const release_time_ms: number = grading_job.priority;
    const released: boolean = release_time_ms < now;
    if (released) {
      // released_wait_times.push(getTimeInQueue(grading_job.created_at)); // Total Wait time of released job
      const wait_time_since_released = now - release_time_ms;
      released_wait_times.push(wait_time_since_released);
    }
    return wait_times.push(getTimeInQueue(grading_job.created_at));
  });

  // Wait times are in milliseconds
  return {
    all: calculateTimeStats(wait_times),
    released: calculateTimeStats(released_wait_times),
  };
};
