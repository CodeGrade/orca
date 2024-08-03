import { getConfig, GradingJobConfig } from "@codegrade-orca/common";
import { execFile } from "child_process";
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
