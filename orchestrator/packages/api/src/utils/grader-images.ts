import { getConfig, GradingJobConfig } from "@codegrade-orca/common";
import { execFile } from "child_process";
import { existsSync } from "fs";
import path = require("path");

const CONFIG = getConfig();

export const touchGraderImageFile = ({
  grader_image_sha,
}: GradingJobConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    execFile(
      "touch",
      [path.join(CONFIG.dockerImageFolder, `${grader_image_sha}.tgz`)],
      (err, _stdout, _stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
};

export const graderImageExists = (graderImageSHA: string) =>
  existsSync(path.join(CONFIG.dockerImageFolder, `${graderImageSHA}.tgz`));
