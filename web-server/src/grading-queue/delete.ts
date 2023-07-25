import { RedisClientType } from "redis";
import { CollationType, DeleteJobRequest } from "./types";
import { JobNonexistentError } from "./exceptions";
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

export default deleteJob;
