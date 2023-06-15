import { addReservation, generateGradingJobFromConfig } from "../utils/helpers";
import { redisLPush, redisSAdd, redisSet, redisZAdd } from "../utils/redis";
import { GradingJob, GradingJobConfig } from "./types";

const createJob = async (
  gradingJobConfig: GradingJob,
  arrivalTime: number,
): Promise<Error | null> => {
  const { key, priority, collation } = gradingJobConfig;
  const releaseTime = priority + arrivalTime;

  const gradingJob = generateGradingJobFromConfig(
    gradingJobConfig,
    arrivalTime,
    releaseTime,
  );

  const nextTask = `${collation.type}.${collation.id}`;

  // Push key to SubmitterInfo list
  const [length, pushErr] = await redisLPush(`SubmitterInfo.${nextTask}`, key);
  if (pushErr) return pushErr;
  if (!length) return Error("Failed to push key to SubmitterInfo.");

  // Create reservation
  const reservationErr = await addReservation(
    `${nextTask}.${arrivalTime}`,
    releaseTime,
  );
  if (reservationErr) return reservationErr;

  // Store nonce
  const [numAdded, nonceErr] = await redisZAdd(
    `Nonces.${collation.type}.${collation.id}`,
    releaseTime,
    arrivalTime.toString(),
  );
  if (nonceErr) return nonceErr;
  if (numAdded !== 1) return Error("Failed to store nonce of grading job.");

  // Store grading job
  const [setStatus, setErr] = await redisSet(key, JSON.stringify(gradingJob));
  if (setErr) return setErr;
  if (setStatus !== "OK") return Error("Failed to set grading job");

  return null;
};

export default createJob;
