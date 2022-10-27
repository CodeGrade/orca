import { Collation, GradingJob, MoveJobAction, MoveJobRequest } from "./types";
import { MOVE_TO_BACK_BUFFER } from "./constants";
import {
  redisGet,
  redisLRem,
  redisRPush,
  redisSet,
  redisZRangeWithScores,
} from "../utils/redis";
import { addToReservations } from "../utils/helpers";
import { upgradeJob } from "./upgrade";

const moveJobHandler = async (
  moveRequest: MoveJobRequest,
): Promise<[number | null, Error | null]> => {
  const { nonce, jobKey, moveAction, collation } = moveRequest;
  if (!collation)
    return [null, Error("No collation data given for moving grading job.")];
  const now = new Date().getTime();

  // Get the grading job being moved
  const [gradingJobStr, getErr] = await redisGet(jobKey);
  if (getErr) return [null, getErr];
  if (!gradingJobStr)
    return [null, Error("Something went wrong while getting job to move.")];

  let gradingJob: GradingJob;
  try {
    gradingJob = JSON.parse(gradingJobStr);
  } catch (error) {
    return [null, error];
  }

  let newReleaseAt: number;
  switch (moveAction) {
    case MoveJobAction.RELEASE:
      const upgradeErr = await upgradeJob(gradingJob);
      if (upgradeErr) return [null, upgradeErr];
      newReleaseAt = now;
      break;
    case MoveJobAction.DELAY:
      const [delayedReleaseAt, delayErr] = await delayJob(
        jobKey,
        nonce,
        collation,
      );
      if (delayErr) return [null, delayErr];
      newReleaseAt = delayedReleaseAt!;
      break;
    default:
      return [null, Error("Invalid MoveJobAction in MoveJobRequest.")];
  }

  // Update stored grading job with newReleaseAt
  const movedGradingJob: GradingJob = {
    ...gradingJob,
    release_at: newReleaseAt,
  };
  const [setStatus, setErr] = await redisSet(
    jobKey,
    JSON.stringify(movedGradingJob),
  );
  if (setErr) return [null, setErr];
  if (setStatus !== "OK")
    return [null, Error("Failed to update job when moving grading job.")];
  return [newReleaseAt, null];
};

const delayJob = async (
  jobKey: string,
  nonce: number,
  collation: Collation,
): Promise<[number | null, Error | null]> => {
  // Get last job in Reservations to calculate out the delayed release time
  const [lastJob, getLastErr] = await getLastReservation();
  if (getLastErr) return [null, getLastErr];

  const lastJobReleaseAt: number = lastJob![0]["score"];
  const newReleaseAt = lastJobReleaseAt + MOVE_TO_BACK_BUFFER;
  const collationKey = `${collation.type}.${collation.id}`;
  const reservationErr = await addToReservations(
    `${collationKey}.${nonce}`,
    newReleaseAt,
  );
  if (reservationErr) return [null, reservationErr];
  const submitterInfoKey = `SubmitterInfo.${collationKey}`;
  const [numRemoved, lRemErr] = await redisLRem(submitterInfoKey, jobKey);
  if (lRemErr) return [null, lRemErr];
  if (numRemoved !== 1)
    return [
      null,
      Error("Failed to update SubmitterInfo when delaying grading job"),
    ];
  const [numAdded, rPushErr] = await redisRPush(submitterInfoKey, jobKey);
  if (rPushErr) return [null, rPushErr];
  if (numAdded !== 1)
    return [
      null,
      Error("Failed to update SubmitterInfo when delaying grading job"),
    ];
  return [newReleaseAt, null];
};

const getLastReservation = async (): Promise<[string | null, Error | null]> => {
  const [lastJob, zRangeErr] = await redisZRangeWithScores(
    "Reservations",
    -1,
    -1,
  );
  if (zRangeErr) return [null, zRangeErr];
  if (!lastJob || lastJob.length === 0)
    return [null, Error("Failed to find last reservation")];
  return [lastJob, null];
};

export default moveJobHandler;
