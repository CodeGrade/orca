import path from "path";
import {
  GraderImageBuildRequest,
  RedisTransactionBuilder,
  getConfig,
  runOperationWithLock,
} from "@codegrade-orca/common";
import { existsSync } from "fs";
import { readdir, rm, stat } from "fs/promises";
import { deleteGraderImageKeyTransaction } from "../grading-queue/delete-image-key";
import {
  clearHoldingPenTransaction,
  getHoldingPenJobs,
  releaseHoldingPenJobsTransaction,
} from "../grading-queue/handle-holding-pen";
import { createAndStoreGraderImage } from "./image-creation";

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
      const executor = await tb.build();
      await executor.execute();
    });
  } catch (err) {
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
