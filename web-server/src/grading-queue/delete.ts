import { RedisClientType } from "redis";
import {
  Collation,
  CollationType,
  DeleteJobRequest,
  EnrichedGradingJob,
} from "./types";
import {
  AssertionError,
  JobNonexistentError,
  NonImmediateJobRemovalError,
} from "./exceptions";
import assert from "assert";

const deleteJob = async (
  client: RedisClientType,
  { jobKey, collation, nonce }: DeleteJobRequest,
): Promise<void> => {
  if (!client.EXISTS(jobKey)) {
    throw new JobNonexistentError(jobKey);
  }

  if (collation) {
    await client.LREM(
      `SubmitterInfo.${CollationType[collation.type]}.${collation.id}`,
      1,
      jobKey,
    );
    await client.ZREM(
      "Reservations",
      [CollationType[collation.type], collation.id, nonce].join("."),
    );
    await client.SREM(
      `Nonces.${CollationType[collation.type]}.${collation.id}`,
      nonce?.toString(),
    );
  } else {
    await client.ZREM("Reservations", `immediate.${nonce}`);
  }

  await client.DEL(jobKey);
};

export const removeNonImmediateJob = async (
  client: RedisClientType,
  jobKey: string,
  collation: Collation,
): Promise<EnrichedGradingJob> => {
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

  const deletedJob = await client.GETDEL(jobKey);
  assertDeletedKey(deletedJob);

  return JSON.parse(deletedJob) as EnrichedGradingJob;
};

function assertDeletedKey(key: string | null): asserts key is string {
  if (typeof key !== "string")
    throw new AssertionError(
      "Did not successfully remove job key after removing it's queue references.",
    );
}

export default deleteJob;
