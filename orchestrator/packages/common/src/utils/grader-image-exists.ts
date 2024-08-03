import path from "path";
import { getConfig } from "../config";
import { existsSync } from "fs";

const graderImageExists = (graderImageSHA: string) =>
  existsSync(path.join(getConfig().dockerImageFolder, `${graderImageSHA}.tgz`));

export default graderImageExists;
