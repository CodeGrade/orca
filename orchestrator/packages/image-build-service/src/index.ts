import {
  GraderImageBuildRequest,
  toMilliseconds,
  isImageBuildResult,
  pushStatusUpdate,
  getConfig,
  GraderImageBuildResult,
  logger
} from "@codegrade-orca/common";
import { getNextImageBuild, handleCompletedImageBuild } from "@codegrade-orca/db";
import { createAndStoreGraderImage, removeStaleImageFiles } from "./process-request";
import { cleanUpDockerFiles, sendJobResultForBuildFail, removeImageFromDockerIfExists, notifyClientOfBuildResult } from "./utils";
import { EnqueuedJobInfo, cleanStaleBuildInfo } from "@codegrade-orca/db";
import path from "path";
import { existsSync, rmSync } from "fs";

const LOOP_SLEEP_TIME = 5; // Seconds

const main = async () => {
  logger.info("Cleaning up stale build info...");
  const shaSumJobInfoPairs = await cleanStaleBuildInfo();
  shaSumJobInfoPairs.forEach(([originalReq, enqueuedJobs]) => {
    removeDockerfileIfExists(originalReq.dockerfile_sha_sum);
    notifyClientOfBuildResult(cleanedImageResult(), originalReq);
    enqueuedJobs.forEach(
      ({ response_url, key, ...status }) => pushStatusUpdate(status, response_url, key)
    );
  });
  logger.info("Build service initialized.");
  while (true) {
    let infoAsBuildReq: GraderImageBuildRequest | undefined = undefined;
    try {
      const nextBuildReq = await getNextImageBuild();

      if (!nextBuildReq) {
        await sleep(LOOP_SLEEP_TIME);
        continue;
      }

      logger.info(`Attempting to build image with SHA ${nextBuildReq.dockerfileSHA}.`);

      infoAsBuildReq = {
        dockerfile_sha_sum: nextBuildReq.dockerfileSHA,
        dockerfile_contents: nextBuildReq.dockerfileContent,
        response_url: nextBuildReq.responseURL,
      };

      const result = await createAndStoreGraderImage(infoAsBuildReq);
      const jobInfo = await handleCompletedImageBuild(nextBuildReq.dockerfileSHA, true) as EnqueuedJobInfo[];

      notifyClientOfBuildResult(result, infoAsBuildReq);
      jobInfo.forEach(({ key, response_url, ...status }) => pushStatusUpdate(status, response_url, key));
      logger.info(`Successfully built image with SHA ${nextBuildReq.dockerfileSHA}.`);
    } catch (err) {
      if (isImageBuildResult(err) && infoAsBuildReq) {
        const cancelledJobInfoList = await handleCompletedImageBuild(infoAsBuildReq.dockerfile_sha_sum, false);
        if (cancelledJobInfoList !== null) {
          cancelledJobInfoList.forEach((cancelInfo) => sendJobResultForBuildFail(cancelInfo));
        }
        notifyClientOfBuildResult(err, infoAsBuildReq);
        await cleanUpDockerFiles(infoAsBuildReq.dockerfile_sha_sum);
      }
      logger.error(`Encountered during image build: ${err}.`);
    } finally {
      if (infoAsBuildReq) {
        await removeImageFromDockerIfExists(infoAsBuildReq.dockerfile_sha_sum);
      }
      await removeStaleImageFiles();
    }
  }
};

const cleanedImageResult = (): GraderImageBuildResult => ({
  was_successful: true,
  logs: [
    "This image successfully built but then the system crashed; we have cleaned up extra files and the image can now be used without issue."
  ]
});

const removeDockerfileIfExists = (dockerfileSHASum: string) => {
  const { dockerImageFolder } = getConfig();
  const imagePath = path.join(dockerImageFolder, `${dockerfileSHASum}.Dockerfile}`)
  if (!existsSync(imagePath)) {
    return;
  }
  rmSync(imagePath);
}

const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, toMilliseconds(seconds));
  });
};

main();
