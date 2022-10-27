import {
  createReservation,
  generateGradingJobFromConfig,
} from "../utils/helpers";
import { redisSet } from "../utils/redis";
import { GradingJobConfig } from "./types";

const createImmediateJob = async (
  gradingJobConfig: GradingJobConfig,
): Promise<Error | null> => {
  const { key, priority } = gradingJobConfig;
  const arrivalTime = new Date().getTime();
  const releaseTime = priority + arrivalTime;
  const gradingJob = generateGradingJobFromConfig(
    gradingJobConfig,
    arrivalTime,
    releaseTime,
  );
  // Create reservation
  const reservationErr = await createReservation(
    `immediate.${key}`,
    releaseTime,
  );
  if (reservationErr) return reservationErr;

  // Store grading job
  const [setStatus, setErr] = await redisSet(key, JSON.stringify(gradingJob));
  if (setErr) return setErr;
  if (setStatus !== "OK") return Error("Failed to set immediate grading job");
  return null;
};
export default createImmediateJob;
