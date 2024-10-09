import { getConfig, GradingJobConfig, logger } from "@codegrade-orca/common";
import { execFile } from "child_process";
import { existsSync } from "fs";
import path = require("path");

const CONFIG = getConfig();

export class TouchGraderImageFileError extends Error {
}

export const touchGraderImageFile = ({
  grader_image_sha,
}: GradingJobConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tgzFileName = `${grader_image_sha}.tgz`;
    const tgzPath = path.join(CONFIG.dockerImageFolder, tgzFileName);
    execFile(
      "touch",
      ["-c", tgzPath],
      (err, _stdout, _stderr) => {
        if (err) {
          return reject(err);
        } else {
          logger.info(`Touching grader image ${grader_image_sha}.tgz`);
        }
      },
    );
    if (!existsSync(tgzPath)) {
      // We do not want to _create_ the path if it does not exist already,
      // throwing off other logic that relies on its existence.
      return reject(new TouchGraderImageFileError(`No grader image exists with name ${tgzFileName}.`));
    }
    resolve();
  });
};
