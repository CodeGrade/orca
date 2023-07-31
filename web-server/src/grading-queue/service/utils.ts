import { RedisClientType } from "redis";
import { EnrichedGradingJob } from "../types";

export const generateNonce = async (
  client: RedisClientType,
  job: EnrichedGradingJob,
  arrivalTime: number,
): Promise<number> => {
  let nonce = arrivalTime + job.priority;
  while (
    await client.SISMEMBER(
      `Nonces.${job.collation.type}${job.collation.id}`,
      nonce.toString(),
    )
  ) {
    nonce++;
  }
  return nonce;
};

export const toMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};
