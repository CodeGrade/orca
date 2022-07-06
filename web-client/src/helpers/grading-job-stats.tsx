import { GradingJobProps } from "../components/reducers/grading-job-reducer";

export const getTimeInQueue = (created_at: number): number => {
  const now: number = new Date().getTime() / 1000; // milliseconds to seconds
  const duration_timestamp: number = now - created_at;
  return duration_timestamp;
};

export type StatsProps = {
  avg: number;
  min: number;
  max: number;
  num: number;
};

export type GradingTableStatsProps = {
  all: StatsProps;
  released: StatsProps;
};

export const getGradingTableStats = (
  grading_job_queue: GradingJobProps[]
): GradingTableStatsProps => {
  let wait_times: number[] = [];
  let released_wait_times: number[] = [];
  const now: number = new Date().getTime();
  grading_job_queue.map((grading_job: GradingJobProps) => {
    const release_time_ms: number = grading_job.priority * 1000;
    const released: boolean = release_time_ms < now;
    if (released) {
      released_wait_times.push(getTimeInQueue(grading_job.created_at));
    }
    return wait_times.push(getTimeInQueue(grading_job.created_at));
  });
  const avg_wait = wait_times.reduce((a, b) => a + b, 0) / wait_times.length;
  const min_wait = Math.min(...wait_times);
  const max_wait = Math.max(...wait_times);

  const released_avg_wait =
    released_wait_times.reduce((a, b) => a + b, 0) / released_wait_times.length;
  const released_min_wait = Math.min(...released_wait_times);
  const released_max_wait = Math.max(...released_wait_times);

  // Wait times are in seconds
  return {
    all: {
      avg: avg_wait,
      min: min_wait,
      max: max_wait,
      num: wait_times.length,
    },
    released: {
      avg: released_avg_wait,
      min: released_min_wait,
      max: released_max_wait,
      num: released_wait_times.length,
    },
  };
};
