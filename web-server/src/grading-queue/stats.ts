import { StoredGradingJob, TimeStats, GradingQueueStats } from "./types";

export const getTimeInQueue = (timestamp: number): number => {
  const now: number = new Date().getTime();
  const duration_timestamp: number = now - timestamp;
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
  grading_job_queue: StoredGradingJob[]
): GradingQueueStats => {
  let wait_times: number[] = [];
  let times_since_released: number[] = [];
  const now: number = new Date().getTime();
  grading_job_queue.map((grading_job: StoredGradingJob) => {
    const release_time: number = grading_job.timestamp + grading_job.priority;
    const released: boolean = release_time < now;
    if (released) {
      // released_wait_times.push(getTimeInQueue(grading_job.timestamp)); // Total Wait time of released job
      const time_since_released = now - release_time;
      times_since_released.push(time_since_released);
    }
    return wait_times.push(getTimeInQueue(grading_job.timestamp));
  });

  // Wait times are in milliseconds
  return {
    all: calculateTimeStats(wait_times),
    released: calculateTimeStats(times_since_released),
  };
};
