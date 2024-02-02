import { createHash } from "crypto";
import { Collation } from "../types/grading-queue";

export const collationToString = (collation: Collation) => {
  return `${collation.type}.${collation.id}`;
};

export const generateQueueKey = (originKey: string, responseURL: string) => {
  const hash = createHash("sha256");
  hash.update(originKey + responseURL);
  return hash.digest("base64");
};

export * from "./filter";
export * from "./stats";
