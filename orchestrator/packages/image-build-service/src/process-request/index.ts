import path from "path";
import {
  getConfig,
  logger,
} from "@codegrade-orca/common";
import { readdir, rm, stat } from "fs/promises";

const CONFIG = getConfig();

const UPPER_LIMIT_OF_TIME_SINCE_IMAGE_USE = 1000 * 60 * 60 * 24 * 7 * 2; // 2 Weeks in ms

export { createAndStoreGraderImage } from "./image-creation";

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
        logger.info(`Removing image ${image} off Orchestrator`);
        imagesRemoved.push(image);
      }
    }),
  );
  return imagesRemoved;
};
