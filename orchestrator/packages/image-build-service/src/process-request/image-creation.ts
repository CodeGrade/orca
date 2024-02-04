import { GraderImageBuildRequest, getConfig } from "@codegrade-orca/common";
import { execFile } from "child_process";
import { writeFile } from "fs";
import { rm } from "fs/promises";
import path from "path";

const CONFIG = getConfig();

export const createAndStoreGraderImage = (
  buildRequest: GraderImageBuildRequest,
) => {
  // TODO: validate dockerfileContent
  return writeDockerfileContentsToFile(buildRequest)
    .then((_) => buildImage(buildRequest))
    .then((_) =>
      rm(
        path.join(
          CONFIG.dockerImageFolder,
          `${buildRequest.dockerfileSHASum}.Dockerfile`,
        ),
      ),
    )
    .then((_) => saveImageToTgz(buildRequest.dockerfileSHASum));
};

const writeDockerfileContentsToFile = ({
  dockerfileContents,
  dockerfileSHASum,
}: GraderImageBuildRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      CONFIG.dockerImageFolder,
      `${dockerfileSHASum}.Dockerfile`,
    );
    writeFile(dockerfilePath, dockerfileContents, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(dockerfilePath);
      }
    });
  });
};

const buildImage = ({
  dockerfileSHASum,
}: GraderImageBuildRequest): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      [
        "build",
        "-t",
        dockerfileSHASum,
        "-f",
        path.join(CONFIG.dockerImageFolder, `${dockerfileSHASum}.Dockerfile`),
        ".",
      ],
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

const saveImageToTgz = (imageName: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      [
        "save",
        "-o",
        path.join(CONFIG.dockerImageFolder, `${imageName}.tgz`),
        imageName,
      ],
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
