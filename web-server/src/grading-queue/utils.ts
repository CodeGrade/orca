import { RedisClientType } from "redis";
import { CollationType, EnrichedGradingJob } from "./types";
import { createHash } from "crypto";
import { AssertionError } from "./exceptions";

export const generateNonce = async (
  client: RedisClientType,
  job: EnrichedGradingJob,
  arrivalTime: number,
): Promise<number> => {
  let nonce = arrivalTime + job.priority;
  while (
    await client.SISMEMBER(
      `Nonces.${CollationType[job.collation.type]}${job.collation.id}`,
      nonce.toString(),
    )
  ) {
    nonce++;
  }
  return nonce;
};

export const createQueueKey = (originKey: string, responseURL: string) => {
  const hash = createHash("sha256");
  hash.update(originKey + responseURL);
  return hash.digest("base64");
};

export const toMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};
