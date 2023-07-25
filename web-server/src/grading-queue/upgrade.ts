import { RedisClientType } from "redis";
import { OrcaRedisClient } from "./client";
import { Collation, EnrichedGradingJob } from "./types";
import { AssertionError, NonImmediateJobRemovalError } from "./exceptions";

export const upgradeJob = async (
  gradingJob: EnrichedGradingJob,
): Promise<void> => {
  const { key, collation } = gradingJob;
  await new OrcaRedisClient().runOperation(async (client: RedisClientType) => {
    // Nonces are purely for uniqueness, so we can just reuse the previous one.
    const prevNonce = await removeNonImmediateJobData(client, key, collation);

    const upgradedTime = Date.now();
    await client.ZADD("Reservations", {
      score: upgradedTime,
      value: `immediate.${gradingJob.orca_key}.${prevNonce}`,
    });
    const updatedJob: EnrichedGradingJob = {
      ...gradingJob,
      release_at: upgradedTime,
    };
    await client.SET(gradingJob.orca_key, JSON.stringify(updatedJob));
  }, true);
};

/**
 Removes the associated SubmitterInfo, Nonces, and Reservations 
 references to the job associated with the given key.
**/
const removeNonImmediateJobData = async (
  client: RedisClientType,
  jobKey: string,
  collation: Collation,
): Promise<number> => {
  const collationKey = `${collation.type}.${collation.id}`;
  const submitterInfoKey = `SubmitterInfo.${collationKey}`;
  const noncesKey = `Nonces.${collationKey}`;

  const submitterKeyPos = await client.LPOS(submitterInfoKey, jobKey);
  if (submitterKeyPos === null) {
    throw new NonImmediateJobRemovalError(
      `The job key ${jobKey} was not found in ${submitterInfoKey}.`,
    );
  }

  const [nonce] = await client.SPOP(noncesKey);

  const reservationKey = `${collationKey}.${nonce}`;
  await client.ZREM("Reservations", reservationKey);

  await client.LREM(submitterInfoKey, 1, jobKey);

  return +nonce;
};
