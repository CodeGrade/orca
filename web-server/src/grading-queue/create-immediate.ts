import {
  addToReservations,
  generateGradingJobFromConfig,
} from "../utils/helpers";
import { redisSet } from "../utils/redis";
import { GradingJobConfig } from "./types";

const createImmediateJob = async (
  gradingJobConfig: GradingJobConfig,
  arrivalTime: number,
): Promise<Error | null> => {
  const { key, priority } = gradingJobConfig;
  const releaseTime = priority + arrivalTime;
  const gradingJob = generateGradingJobFromConfig(
    gradingJobConfig,
    arrivalTime,
    releaseTime,
  );
  // Create reservation
  const reservationErr = await addToReservations(
    `immediate.${key}`,
    releaseTime,
  );
  if (reservationErr) return reservationErr;

  // Store grading job
  const [setStatus, setErr] = await redisSet(key, gradingJob);
  if (setErr) return setErr;
  if (setStatus !== "OK") return Error("Failed to set immediate grading job");
  return null;
};
export default createImmediateJob;
