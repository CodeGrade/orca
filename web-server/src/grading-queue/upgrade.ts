import { redisLRem, redisSRem, redisZRem } from "../utils/redis";
import createImmediateJob from "./create-immediate";
import { Collation, GradingJob, GradingJobConfig } from "./types";

const removeNonImmediateJob = async (
  key: string,
  collation: Collation,
): Promise<null | Error> => {
  const collationKey = `${collation.type}.${collation.id}`;
  const [numLRemoved, lRemErr] = await redisLRem(
    `SubmitterInfo.${collationKey}`,
    key,
  );
  if (lRemErr) return lRemErr;
  if (numLRemoved !== 1)
    return Error(
      "Something went wrong while removing existing non-immediate job.",
    );

  // TODO: THIS IS WRONG - ASK JACKSON ABOUT THE SPOP LINE TO GET THE NONCE FOR SPECIFIC JOB
  let nonce; // Need to get this here
  const [numSRemoved, sRemErr] = await redisSRem(`Nonces.${collationKey}`, key);
  if (sRemErr) return sRemErr;
  if (numSRemoved !== 1)
    return Error(
      "Something went wrong while removing existing non-immediate job.",
    );
  const [numZRemoved, zRemErr] = await redisZRem(
    "Reservations",
    `${collationKey}.${nonce}`,
  );
  if (zRemErr) return zRemErr;
  if (numZRemoved !== 1)
    return Error(
      "Something went wrong while removing existing non-immediate job.",
    );
  return null;
};

export const upgradeJob = async (
  gradingJobConfig: GradingJobConfig,
  arrivalTime: number,
): Promise<null | Error> => {
  const { key, collation } = gradingJobConfig;
  const remErr = await removeNonImmediateJob(key, collation);
  if (remErr) return remErr;
  const createErr = await createImmediateJob(gradingJobConfig, arrivalTime);
  if (createErr) return createErr;
  return null;
};
