import { RedisClientType } from "redis";
import { CollationType, EnrichedGradingJob } from "./types";
import { createHash } from "crypto";
import { AssertionError } from "./exceptions";

export const generateNonce = (
  client: RedisClientType,
  job: EnrichedGradingJob,
  arrivalTime: number,
) => {
  let nonce = arrivalTime + job.priority;
  while (
    client.SISMEMBER(
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
