import path from "path";
import {
  GraderImageBuildRequest,
  RedisTransactionBuilder,
  getConfig,
  runOperationWithLock,
} from "@codegrade-orca/common";
import { execFile, ExecFileException } from "child_process";
import { existsSync, writeFile } from "fs";
import { readdir, rm, stat } from "fs/promises";
import { deleteGraderImageKeyTransaction } from "../grading-queue/delete-image-key";
import {
  clearHoldingPenTransaction,
  getHoldingPenJobs,
  releaseHoldingPenJobsTransaction,
} from "../grading-queue/handle-holding-pen";

const CONFIG = getConfig();

const UPPER_LIMIT_OF_TIME_SINCE_IMAGE_USE = 1000 * 60 * 60 * 24 * 7 * 2; // 2 Weeks in ms

export const processBuildRequest = async (
  buildReq: GraderImageBuildRequest,
) => {
  try {
    await createAndStoreGraderImage(buildReq);
    await runOperationWithLock(async (redisConnection) => {
      const holdingPenJobs = await getHoldingPenJobs(
        redisConnection,
        buildReq.dockerfileSHASum,
      );
      const tb = new RedisTransactionBuilder(redisConnection);
      deleteGraderImageKeyTransaction(tb, buildReq.dockerfileSHASum);
      await releaseHoldingPenJobsTransaction(
        redisConnection,
        tb,
        holdingPenJobs,
        buildReq.dockerfileSHASum,
      );
    });
  } catch {
    await runOperationWithLock(async (redisConnection) => {
      const tb = new RedisTransactionBuilder(redisConnection);
      deleteGraderImageKeyTransaction(tb, buildReq.dockerfileSHASum);
      clearHoldingPenTransaction(tb, buildReq.dockerfileSHASum);
      // TODO: Get all jobs and send a "cancelled" API request to Bottlenose.
      const executor = await tb.build();
      await executor.execute();
    });
    const imageTGZPath = path.join(
      CONFIG.dockerImageFolder,
      `${buildReq.dockerfileSHASum}.tgz`,
    );
    if (existsSync(imageTGZPath)) {
      await rm(imageTGZPath);
    }
  }
};

export const removeStaleImageFiles = async (): Promise<Array<string>> => {
  const dockerImageFiles = await readdir(CONFIG.dockerImageFolder);
  const imagesRemoved: Array<string> = [];
  const currentDate = new Date();
  await Promise.all(
    dockerImageFiles.map(async (image) => {
      const pathToImage = path.join(CONFIG.dockerImageFolder, image);
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
  dockerfileContents: dockerfileContent,
  dockerfileSHASum,
}: GraderImageBuildRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dockerfilePath = path.join(
      CONFIG.dockerImageFolder,
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
