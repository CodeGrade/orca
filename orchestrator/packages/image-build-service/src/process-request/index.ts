import path from "path";
import {
  GraderImageBuildRequest,
  getConfig,
} from "@codegrade-orca/common";
import { } from "@codegrade-orca/db";
import { existsSync } from "fs";
import { readdir, rm, stat } from "fs/promises";
import { createAndStoreGraderImage } from "./image-creation";

const CONFIG = getConfig();

const UPPER_LIMIT_OF_TIME_SINCE_IMAGE_USE = 1000 * 60 * 60 * 24 * 7 * 2; // 2 Weeks in ms

export const processBuildRequest = async (
  buildReq: GraderImageBuildRequest,
) => {
  try {
    await createAndStoreGraderImage(buildReq);
    await
  } catch (err) {
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
