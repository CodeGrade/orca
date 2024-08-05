import { graderImageExists } from "@codegrade-orca/common";
import { GraderImageBuildRequest } from "@codegrade-orca/common";
import prismaInstance from "../prisma-instance"
import handleCompletedImageBuild, { EnqueuedJobInfo } from "./handle-completed-image-build"

const cleanStaleBuildInfo = async (): Promise<Array<[GraderImageBuildRequest, EnqueuedJobInfo[]]>> =>
  prismaInstance.$transaction(async (tx) => {
    const possibleStaleBuildInfo = await tx.imageBuildInfo.findMany({ where: { inProgress: true } });
    if (!possibleStaleBuildInfo.length) {
      return [];
    }

    return await Promise.all(possibleStaleBuildInfo.map(async (buildInfo) => {
      const { dockerfileSHA } = buildInfo;
      if (graderImageExists(dockerfileSHA)) {
        const originalReq: GraderImageBuildRequest = {
          dockerfile_sha_sum: dockerfileSHA,
          dockerfile_contents: buildInfo.dockerfileContent,
          response_url: buildInfo.responseURL
        };
        return [originalReq, await handleCompletedImageBuild(dockerfileSHA, true) as EnqueuedJobInfo[]];
      } else {
        await tx.imageBuildInfo.update({ where: { dockerfileSHA }, data: { inProgress: false } });
        return [];
      }
    })).then((lists) => lists.filter((possiblePair) => possiblePair.length)) as [GraderImageBuildRequest, EnqueuedJobInfo[]][];
  });

export default cleanStaleBuildInfo;
