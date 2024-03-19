import { getConfig } from "@codegrade-orca/common";
import { existsSync, rmSync } from "fs";
import path from "path";

const CONFIG = getConfig();

export const cleanUpDockerFiles = async (dockerfileSHA: string) => {
  [".Dockerfile", ".tgz"].forEach((fExt) => {
    const filePath = path.join(CONFIG.dockerImageFolder, `${dockerfileSHA}.${fExt}`);
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  });
};
