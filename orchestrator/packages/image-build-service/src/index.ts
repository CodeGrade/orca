import {
  GraderImageBuildRequest,
  toMilliseconds,
} from "@codegrade-orca/common";
import { getNextImageBuild, handleCompletedImageBuild } from "@codegrade-orca/db";
import { createAndStoreGraderImage, removeStaleImageFiles } from "./process-request";
import { cleanUpDockerFiles, notifyClientOfServiceFailure, removeImageFromDockerIfExists } from "./utils";

const LOOP_SLEEP_TIME = 5; // Seconds

const main = async () => {
  console.info("Build service initialized.");
  while (true) {
    let currentDockerSHASum: string | undefined = undefined;
    try {
      const nextBuildReq = await getNextImageBuild();

      if (!nextBuildReq) {
        await sleep(LOOP_SLEEP_TIME);
        continue;
      }

      currentDockerSHASum = nextBuildReq.dockerfileSHA;
      console.info(`Attempting to build image with SHA ${nextBuildReq.dockerfileSHA}.`);
      await createAndStoreGraderImage({
        dockerfileSHASum: nextBuildReq.dockerfileSHA,
        dockerfileContents: nextBuildReq.dockerfileContent
      } as GraderImageBuildRequest);

      await handleCompletedImageBuild(nextBuildReq.dockerfileSHA, true);
      console.info(`Successfully build image with SHA ${nextBuildReq.dockerfileSHA}.`);
    } catch (err) {
      if (currentDockerSHASum) {
        const cancelledJobInfoList = await handleCompletedImageBuild(currentDockerSHASum, false);
        if (cancelledJobInfoList !== null) {
          await Promise.all(cancelledJobInfoList.map((cancelInfo) => {
            notifyClientOfServiceFailure(
              cancelInfo,
              `Failed to build image with SHA sum ${currentDockerSHASum} for this job.`
            ).catch((notifyError) => console.error(notifyError)); // At this point we can't really do anything, but we should at least log out what happened.
          }));
        }
        await cleanUpDockerFiles(currentDockerSHASum);
      }
      console.error(err);
    } finally {
      if (currentDockerSHASum) {
        await removeImageFromDockerIfExists(currentDockerSHASum);
      }
      await removeStaleImageFiles();
    }
  }
};


const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, toMilliseconds(seconds));
  });
};

main();
