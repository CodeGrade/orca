import path from "path";
import { GraderImageBuildRequest } from "./types";
import { execFile } from "child_process";
import { existsSync, writeFile } from "fs";
import { mkdir, readdir, rm, stat } from "fs/promises";
import { stderr } from "process";
import { GradingJobConfig } from "../grading-queue/types";

export const DOCKER_IMAGE_FILE_LOCATION = path.join(
  __dirname,
  "../../",
  "images",
); // web-server/images
const UPPER_LIMIT_OF_TIME_SINCE_IMAGE_USE = 1000 * 60 * 60 * 24 * 7 * 2; // 2 Weeks in ms

export const removeStaleImageFiles = async (): Promise<Array<string>> => {
  const dockerImageFiles = await readdir(DOCKER_IMAGE_FILE_LOCATION);
  const imagesRemoved: Array<string> = [];
  const currentDate = new Date();
  await Promise.all(
    dockerImageFiles.map(async (image) => {
      const pathToImage = path.join(DOCKER_IMAGE_FILE_LOCATION, image);
      const { mtime } = await stat(pathToImage);
      if (
        currentDate.getTime() - mtime.getTime() >
        UPPER_LIMIT_OF_TIME_SINCE_IMAGE_USE
      ) {
        await rm(pathToImage);
        imagesRemoved.push(image);
      }
    }),
  );
  return imagesRemoved;
};

export const touchGraderImageFile = ({
  grader_image_sha,
}: GradingJobConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    execFile(
      "touch",
      [path.join(DOCKER_IMAGE_FILE_LOCATION, `${grader_image_sha}.tgz`)],
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

export const graderImageExists = ({
  grader_image_sha,
}: GradingJobConfig): boolean => {
  return existsSync(
    path.join(DOCKER_IMAGE_FILE_LOCATION, `${grader_image_sha}.tgz`),
  );
};

export const createAndStoreGraderImage = (
  buildRequest: GraderImageBuildRequest,
) => {
  // TODO: validate dockerfileContent
  return writeDockerfileContentsToFile(buildRequest)
    .then((_) => buildImage(buildRequest))
    .then((_) =>
      rm(
        path.join(
          DOCKER_IMAGE_FILE_LOCATION,
          `${buildRequest.dockerfileSHASum}.Dockerfile`,
        ),
      ),
    )
    .then((_) => saveImageToTgz(buildRequest.dockerfileSHASum));
};

const writeDockerfileContentsToFile = ({
  dockerfileContents: dockerfileContent,
  dockerfileSHASum,
}: GraderImageBuildRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      DOCKER_IMAGE_FILE_LOCATION,
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
        path.join(DOCKER_IMAGE_FILE_LOCATION, dockerfileSHASum),
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
        path.join(DOCKER_IMAGE_FILE_LOCATION, `${imageName}.tgz`),
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
