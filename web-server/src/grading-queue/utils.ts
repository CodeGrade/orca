import { Collation } from "./types";
import { createHash } from "crypto";

export const createQueueKey = (originKey: string, responseURL: string) => {
  const hash = createHash("sha256");
  hash.update(originKey + responseURL);
  return hash.digest("base64");
};

export const collationToString = (collation: Collation) => {
  return `${collation.type}.${collation.id}`;
};
