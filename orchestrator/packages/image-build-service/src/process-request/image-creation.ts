import { GraderImageBuildRequest, ImageBuildFailure, ImageBuildLog, getConfig } from "@codegrade-orca/common";
import { execFile } from "child_process";
import { writeFile, rm } from "fs";
import path from "path";

const CONFIG = getConfig();

export const createAndStoreGraderImage = (
  buildRequest: GraderImageBuildRequest,
) => {
  const buildLogs: Array<ImageBuildLog> = [];
  return writeDockerfileContentsToFile(buildRequest, buildLogs)
    .then((_) => buildImage(buildRequest, buildLogs))
    .then((_) =>
      removeDockerfileAfterBuild(
        path.join(CONFIG.dockerImageFolder, `${buildRequest.dockerfileSHASum}.Dockerfile`),
        buildLogs
      ))
    .then((_) => saveImageToTgz(buildRequest.dockerfileSHASum, buildLogs));
};

const writeDockerfileContentsToFile = ({ dockerfileContents, dockerfileSHASum }: GraderImageBuildRequest, buildLogs: Array<ImageBuildLog>): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      CONFIG.dockerImageFolder,
      `${dockerfileSHASum}.Dockerfile`,
    );
    writeFile(dockerfilePath, dockerfileContents, (err) => {
      buildLogs.push({
        step: "Write request contents to Dockerfile.",
        stderr: ""
      });
      if (err) {
        const buildFailure: ImageBuildFailure = {
          logs: buildLogs,
          error: err
        };
        reject(buildFailure);
      } else {
        resolve(dockerfilePath);
      }
    });
  });
};

const buildImage = ({ dockerfileSHASum }: GraderImageBuildRequest, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  const dockerBuildArgs = [
    "build",
    "-t",
    dockerfileSHASum,
    "-f",
    path.join(CONFIG.dockerImageFolder, `${dockerfileSHASum}.Dockerfile`),
    ".",
  ];
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      dockerBuildArgs,
      (err, _stdout, stderr) => {
        buildLogs.push({
          step: "Run docker build on Dockerfile.",
          cmd: ["docker", ...dockerBuildArgs],
          stderr
        });
        if (err) {
          const buildFailure: ImageBuildFailure = {
            error: err,
            logs: buildLogs
          };
          reject(buildFailure);
        } else {
          resolve();
        }
      },
    );
  });
};

const removeDockerfileAfterBuild = (dockerfilePath: string, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  buildLogs.push({
    stderr: "",
    step: "Remove residual Dockerfile."
  });
  return new Promise<void>((resolve, reject) => {
    rm(dockerfilePath, (err) => {
      if (err) {
        const buildFailure: ImageBuildFailure = { error: err, logs: buildLogs };
        reject(buildFailure);
      } else {
        resolve();
      }
    })
  });
};

const saveImageToTgz = (imageName: string, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  const dockerSaveCommandArgs = [
    "save",
    "-o",
    path.join(CONFIG.dockerImageFolder, `${imageName}.tgz`),
    imageName,
  ];
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      dockerSaveCommandArgs,
      (err, _stdout, stderr) => {
        if (err) {
          const buildFailure: ImageBuildFailure = {
            error: err,
            logs: [...buildLogs, {
              step: "Save image to .tgz file.",
              cmd: ["docker", ...dockerSaveCommandArgs],
              stderr
            }],
          };
          reject(buildFailure);
        } else {
          resolve();
        }
      },
    );
  });
};
