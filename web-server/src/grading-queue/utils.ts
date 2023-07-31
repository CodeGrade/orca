import { RedisClientType } from "redis";
import { CollationType, EnrichedGradingJob } from "./types";
import { createHash } from "crypto";
import { AssertionError } from "./exceptions";

export const createQueueKey = (originKey: string, responseURL: string) => {
  const hash = createHash("sha256");
  hash.update(originKey + responseURL);
  return hash.digest("base64");
};
