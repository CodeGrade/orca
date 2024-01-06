import path from "path";
import { GraderImageBuildRequest } from "./types";
import { execFile } from "child_process";
import { existsSync, writeFile } from "fs";
import { mkdir } from "fs/promises";
import { stderr } from "process";
import { GradingJobConfig } from "../grading-queue/types";

export const DOCKER_IMAGE_FILE_LOCATION = path.join(
  __dirname,
  "../../",
  "images",
); // web-server/images

export const graderImageExists = ({
  grader_image_sha,
}: GradingJobConfig): boolean => {
  return existsSync(
    path.join(
      DOCKER_IMAGE_FILE_LOCATION,
      grader_image_sha,
      `${grader_image_sha}.tgz`,
    ),
  );
};

export const createAndStoreGraderImage = (
  buildRequest: GraderImageBuildRequest,
) => {
  // TODO: validate dockerfileContent
  const graderImageDirectory = path.join(
    DOCKER_IMAGE_FILE_LOCATION,
    buildRequest.dockerfileSHASum,
  );
  return mkdir(graderImageDirectory, {
    recursive: true,
  })
    .then((_) =>
      writeDockerfileContentsToFile(buildRequest, graderImageDirectory),
    )
    .then((dockerfilePath) => {
      return buildImage(buildRequest, dockerfilePath);
    })
    .then((_) => saveImageToTgz(buildRequest.dockerfileSHASum))
    .catch((reason) => console.error(reason));
};

const writeDockerfileContentsToFile = (
  {
    dockerfileContents: dockerfileContent,
    dockerfileSHASum,
  }: GraderImageBuildRequest,
  dockerImageDir: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      dockerImageDir,
      `${dockerfileSHASum}.Dockerfile`,
    );
    writeFile(dockerfilePath, dockerfileContent, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(dockerfilePath);
      }
    });
  });
};

const buildImage = (
  { dockerfileSHASum }: GraderImageBuildRequest,
  dockerfilePath: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    execFile(
      "docker",
      ["build", "-t", dockerfileSHASum, "-f", dockerfilePath, "."],
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
        path.join(DOCKER_IMAGE_FILE_LOCATION, imageName, `${imageName}.tgz`),
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
