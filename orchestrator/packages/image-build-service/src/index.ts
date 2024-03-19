import {
  GraderImageBuildRequest,
  toMilliseconds,
} from "@codegrade-orca/common";
import { getNextImageBuild, handleCompletedImageBuild  } from "@codegrade-orca/db";
import { createAndStoreGraderImage, removeStaleImageFiles } from "./process-request";
import { cleanUpDockerFiles } from "./utils";

const LOOP_SLEEP_TIME = 5; // Seconds

const main = async () => {
  console.info("Build service initialized.");
  while (true) {
    let currentDockerSHASum: string;
    try {
      const nextBuildReq = await getNextImageBuild();

      if (!nextBuildReq) {
        await sleep(LOOP_SLEEP_TIME);
        continue;
      }

      currentDockerSHASum = nextBuildReq.dockerfileSHA;
      await createAndStoreGraderImage({
        dockerfileSHASum: nextBuildReq.dockerfileSHA,
        dockerfileContents: nextBuildReq.dockerfileContent
      } as GraderImageBuildRequest);
      await handleCompletedImageBuild(nextBuildReq.dockerfileSHA, true);
    } catch (err) {
      if (currentDockerSHASum) {
        // TODO: Send GradingJobResults back to clients on build failure.
        await handleCompletedImageBuild(currentDockerSHASum, false);
        await cleanUpDockerFiles(currentDockerSHASum);
      }
      console.error(err);
    } finally {
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
