import { GradingJobConfig, GradingJobResult, getConfig } from "@codegrade-orca/common";
import { CancelJobInfo } from "@codegrade-orca/db/dist/image-builder-operations/handle-completed-image-build";
import { execFile } from "child_process";
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


export const removeImageFromDockerIfExists = async (dockerfileSHASum: string) => {
  if (await imageExistsInDocker(dockerfileSHASum)) {
    await deleteImage(dockerfileSHASum);
  }
};

const deleteImage = (dockerfileSHASum: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    execFile("docker", ["image", "rm", `${dockerfileSHASum}:latest`], (err, _stdout, _stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const imageExistsInDocker = (dockerfileSHASum: string): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    execFile("docker", ["image", "ls", "--format", "{{.Repository}}:{{.Tag}}"], (err, stdout, _stderr) => {
      if (err) {
        reject(err);
      } else {
        const images = stdout.split("\n");
        resolve(images.includes(`${dockerfileSHASum}:latest`));
      }
    });
  });
};

export const notifyClientOfServiceFailure = async (cancelInfo: CancelJobInfo, reason: string) => {
  const result: GradingJobResult = {
    shell_responses: [],
    errors: [reason],
  }
  await fetch(cancelInfo.response_url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({...result, key: cancelInfo.key})
  })
}
