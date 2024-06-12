import path from "path";
import { getConfig } from "./config";
import validations from "./validations";
import { existsSync } from "fs";

export * from "./grading-jobs";
export * from "./types";
export * from "./config";
export { validations };

export const toMilliseconds = (seconds: number) => seconds * 1_000;
export const imageWithSHAExists = (dockerfileSHASum: string): boolean => {
  const filepath = path.join(getConfig().dockerImageFolder, `${dockerfileSHASum}.tgz`);
  return existsSync(filepath);
}
