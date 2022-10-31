import { TimeStats, GradingQueueStats, GradingJob } from "./types";

export const getTimeInQueue = (timestamp: number): number => {
  const now: number = new Date().getTime();
  const durationTimestamp: number = now - timestamp;
  return durationTimestamp;
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
  gradingJobs: GradingJob[],
): GradingQueueStats => {
  let waitTimes: number[] = [];
  let timeSinceReleasedArr: number[] = [];
  const now: number = new Date().getTime();
  gradingJobs.map((gradingJob: GradingJob) => {
    const releaseTime: number = gradingJob.release_at;
    const released: boolean = releaseTime < now;
    if (released) {
      // released_wait_times.push(getTimeInQueue(grading_job.timestamp)); // Total Wait time of released job
      const timeSinceReleased = now - releaseTime;
      timeSinceReleasedArr.push(timeSinceReleased);
    }
    return waitTimes.push(getTimeInQueue(gradingJob.created_at));
  });

  // Wait times are in milliseconds
  return {
    all: calculateTimeStats(waitTimes),
    released: calculateTimeStats(timeSinceReleasedArr),
  };
};
