import {
  GraderImageBuildRequest,
  toMilliseconds,
  isImageBuildResult,
  pushStatusUpdate
} from "@codegrade-orca/common";
import { getNextImageBuild, handleCompletedImageBuild } from "@codegrade-orca/db";
import { createAndStoreGraderImage, removeStaleImageFiles } from "./process-request";
import { cleanUpDockerFiles, sendJobResultForBuildFail, removeImageFromDockerIfExists, notifyClientOfBuildResult } from "./utils";
import { EnqueuedJobInfo, cleanStaleBuildInfo } from "@codegrade-orca/db";

const LOOP_SLEEP_TIME = 5; // Seconds

const main = async () => {
  console.info("Cleaning up stale build info...");
  const enqueuedJobs = await cleanStaleBuildInfo();
  await Promise.all(enqueuedJobs.map(
    ({ response_url, key, ...status }) => pushStatusUpdate(status, response_url, key)
  ));
  console.info("Build service initialized.");
  while (true) {
    let infoAsBuildReq: GraderImageBuildRequest | undefined = undefined;
    try {
      const nextBuildReq = await getNextImageBuild();

      if (!nextBuildReq) {
        await sleep(LOOP_SLEEP_TIME);
        continue;
      }

      console.info(`Attempting to build image with SHA ${nextBuildReq.dockerfileSHA}.`);
      infoAsBuildReq = {
        dockerfile_sha_sum: nextBuildReq.dockerfileSHA,
        dockerfile_contents: nextBuildReq.dockerfileContent,
        response_url: nextBuildReq.responseURL,
      };
      const result = await createAndStoreGraderImage(infoAsBuildReq);
      // When success is passed as true, we get EnqueuedJobInfo[].
      const jobInfo = await handleCompletedImageBuild(nextBuildReq.dockerfileSHA, true) as EnqueuedJobInfo[];
      await notifyClientOfBuildResult(result, infoAsBuildReq);
      await Promise.all(jobInfo.map(({ key, response_url, ...status }) => pushStatusUpdate(status, response_url, key)));
      console.info(`Successfully built image with SHA ${nextBuildReq.dockerfileSHA}.`);
    } catch (err) {
      if (isImageBuildResult(err) && infoAsBuildReq) {
        const cancelledJobInfoList = await handleCompletedImageBuild(infoAsBuildReq.dockerfile_sha_sum, false);
        if (cancelledJobInfoList !== null) {
          await Promise.all(cancelledJobInfoList.map((cancelInfo) => {
            sendJobResultForBuildFail(
              cancelInfo,
            ).catch((notifyError) => console.error(notifyError)); // At this point we can't really do anything, but we should at least log out what happened.
          }));
        }
        await notifyClientOfBuildResult(err, infoAsBuildReq).catch((notifyError) => console.error(notifyError));
        await cleanUpDockerFiles(infoAsBuildReq.dockerfile_sha_sum);
      }
      console.error(err);
    } finally {
      if (infoAsBuildReq) {
        await removeImageFromDockerIfExists(infoAsBuildReq.dockerfile_sha_sum);
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
