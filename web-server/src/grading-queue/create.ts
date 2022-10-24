import { addToReservations } from "../utils/helpers";
import { redisLPush, redisSAdd, redisSet } from "../utils/redis";
import { GradingJob } from "./types";

const createJob = async (
  gradingJob: GradingJob,
  arrivalTime: number,
  releaseTime: number,
): Promise<Error | null> => {
  const { key, collation } = gradingJob;
  const nextTask = `${collation.type}.${collation.id}`;

  // Push key to SubmitterInfo list
  const [length, pushErr] = await redisLPush(`SubmitterInfo.${nextTask}`, key);
  if (pushErr) return pushErr;
  if (!length) return Error("Failed to push key to SubmitterInfo.");

  // Create reservation
  const reservationErr = await addToReservations(
    `${nextTask}.${arrivalTime}`,
    releaseTime,
  );
  if (reservationErr) return reservationErr;

  // Store nonce
  const [numAdded, nonceErr] = await redisSAdd(
    `Nonces.${collation.type}.${collation.id}`,
    arrivalTime,
  );
  if (nonceErr) return nonceErr;
  if (numAdded !== 1) return Error("Failed to store job nonce.");

  const [setStatus, setErr] = await redisSet(key, gradingJob);
  if (setErr) return setErr;
  if (setStatus !== "OK") return Error("Failed to set grading job");
  return null;
};

export default createJob;
