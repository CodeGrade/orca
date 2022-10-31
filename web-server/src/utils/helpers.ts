import {
  Collation,
  GradingJob,
  GradingJobConfig,
} from "../grading-queue/types";
import {
  redisExists,
  redisLPos,
  redisLRange,
  redisLRem,
  redisSPopOne,
  redisSRem,
  redisZAdd,
  redisZRange,
  redisZRem,
} from "./redis";

export const nonImmediateJobExists = async (
  key: string,
  collation: Collation,
): Promise<[boolean | null, Error | null]> => {
  const [submitterInfo, submitterInfoErr] = await getSubmitterInfo(
    `SubmitterInfo.${collation.type}.${collation.id}`,
  );
  if (submitterInfoErr) return [null, submitterInfoErr];
  for (let jobKey in submitterInfo!) {
    if (jobKey === key) return [true, null];
  }
  return [false, null];
};

export const jobInQueue = async (
  key: string,
): Promise<[boolean | null, Error | null]> => {
  const [exists, existsErr] = await redisExists(key);
  if (existsErr) return [null, existsErr];
  return [exists ? true : false, null];
};

export const generateGradingJobFromConfig = (
  gradingJobConfig: GradingJobConfig,
  arrivalTime: number,
  releaseTime: number,
): GradingJob => {
  const gradingJob: GradingJob = {
    ...gradingJobConfig,
    release_at: releaseTime,
    created_at: arrivalTime,
  };
  return gradingJob;
};

// TODO: Don't really need these wrappers
export const addReservation = async (
  member: string,
  score: number,
): Promise<Error | null> => {
  // should always be 1 since we only ever add 1 entry at time
  const [numAdded, zAddErr] = await redisZAdd("Reservations", score, member);
  if (zAddErr) return zAddErr;
  if (numAdded !== 1) return Error("Error while creating reservation.");
  return null;
};

export const filterNull = (arr: any[]): any[] => {
  return arr.filter((x) => x);
};

export const getSubmitterInfo = async (
  submitterInfoKey: string,
): Promise<[string[] | null, Error | null]> => {
  const [submitterInfo, lRangeErr] = await redisLRange(submitterInfoKey, 0, -1);
  if (lRangeErr) return [null, lRangeErr];
  if (!submitterInfo)
    return [
      null,
      Error(
        "Failed to retrieve submitter info for given submitter when moving grading job.",
      ),
    ];
  return [submitterInfo, null];
};

export const removeNonImmediateJob = async (
  key: string,
  collation: Collation,
): Promise<null | Error> => {
  const collationKey = `${collation.type}.${collation.id}`;
  const submitterInfoKey = `SubmitterInfo.${collationKey}`;
  const noncesKey = `Nonces.${collationKey}`;

  // Get index of job key in SubmitterInfo list
  const [index, lPosErr] = await redisLPos(submitterInfoKey, key);
  if (lPosErr) return lPosErr;
  if (index === null)
    return Error(
      "Failed to find job key in submitter info when removing non-immediate job",
    );

  // Get nonce
  const [nonces, zRangeErr] = await redisZRange(noncesKey, index, index);
  if (zRangeErr) return zRangeErr;
  if (!nonces || nonces.length !== 1)
    return Error(
      "Something went wrong while getting nonce for removing non-immediate job",
    );
  const [nonce] = nonces;
  if (!nonce)
    return Error(
      "Something went wrong while deleting nonce for removing non-immediate job",
    );

  // Delete nonce
  const [numNonceRemoved, remNonceErr] = await redisZRem(noncesKey, nonce);
  if (remNonceErr) return remNonceErr;
  if (numNonceRemoved !== 1)
    return Error(
      "Something went wrong while removing nonce for removing non-immediate job.",
    );

  // Delete job key from SubmitterInfo
  const [numLRemoved, lRemErr] = await redisLRem(submitterInfoKey, key);
  if (lRemErr) return lRemErr;
  if (numLRemoved !== 1)
    return Error(
      "Something went wrong while removing key from submitter info for existing non-immediate job.",
    );

  // Delete reservation
  const [numZRemoved, zRemErr] = await redisZRem(
    "Reservations",
    `${collationKey}.${nonce}`,
  );
  if (zRemErr) return zRemErr;
  if (numZRemoved !== 1)
    return Error(
      "Something went wrong while removing reservation for existing non-immediate job.",
    );
  return null;
};
