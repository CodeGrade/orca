import { GraderImageBuildRequest, GraderImageBuildResult, ImageBuildLog, ImageBuildStep, getConfig } from "@codegrade-orca/common";
import { execFile } from "child_process";
import { writeFile, rm } from "fs";
import path from "path";

const CONFIG = getConfig();

export const createAndStoreGraderImage = (
  buildRequest: GraderImageBuildRequest,
): Promise<GraderImageBuildResult> => {
  const buildLogs: Array<ImageBuildLog> = [];
  return writeDockerfileContentsToFile(buildRequest, buildLogs)
    .then((_) => buildImage(buildRequest, buildLogs))
    .then((_) =>
      removeDockerfileAfterBuild(
        path.join(CONFIG.dockerImageFolder, `${buildRequest.dockerfile_sha_sum}.Dockerfile`),
        buildLogs
      ))
    .then((_) => saveImageToTgz(buildRequest.dockerfile_sha_sum, buildLogs))
    .then((_) => ({ logs: buildLogs, was_successful: true }));
};

const writeDockerfileContentsToFile = ({ dockerfile_contents, dockerfile_sha_sum }: GraderImageBuildRequest, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      CONFIG.dockerImageFolder,
      `${dockerfile_sha_sum}.Dockerfile`,
    );
    writeFile(dockerfilePath, dockerfile_contents, (err) => {
      const step: ImageBuildStep = "Write request contents to Dockerfile.";
      if (err) {
        buildLogs.push({
          step,
          error: err.toString(),
        });
        reject({
          logs: buildLogs,
          was_successful: false,
        });
      } else {
        buildLogs.push({
          step,
          output: "Contents written to Dockerfile."
        });
        resolve();
      }
    });
  });
};

const buildImage = ({ dockerfile_sha_sum }: GraderImageBuildRequest, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  const dockerBuildArgs = [
    "build",
    "-t",
    dockerfile_sha_sum,
    "-f",
    path.join(CONFIG.dockerImageFolder, `${dockerfile_sha_sum}.Dockerfile`),
    ".",
  ];
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      dockerBuildArgs,
      (err, stdout, stderr) => {
        const step: ImageBuildStep = "Run docker build on Dockerfile.";
        if (err) {
          buildLogs.push({
            step,
            error: stderr
          });
          reject({
            was_successful: false,
            logs: buildLogs
          });
        } else {
          buildLogs.push({
            step,
            output: stdout
          });
          resolve();
        }
      },
    );
  });
};

const removeDockerfileAfterBuild = (dockerfilePath: string, buildLogs: Array<ImageBuildLog>): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    rm(dockerfilePath, (err) => {
      const step: ImageBuildStep = "Remove Dockerfile.";
      if (err) {
        buildLogs.push({ step, error: err.toString() });
        reject({ was_successful: false, logs: buildLogs });
      } else {
        buildLogs.push({ step, output: "Successfully cleaned up Dockerfile." });
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
        const step: ImageBuildStep = "Save image to .tgz file.";
        if (err) {
          buildLogs.push({ step, error: stderr });
          reject({ was_successful: false, logs: buildLogs });
        } else {
          buildLogs.push({ step, output: `Successfully saved image to ${imageName}.tgz.` });
          resolve();
        }
      },
    );
  });
};
