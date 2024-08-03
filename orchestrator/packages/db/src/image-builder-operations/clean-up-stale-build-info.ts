import { graderImageExists } from "@codegrade-orca/common";
import prismaInstance from "../prisma-instance"
import handleCompletedImageBuild, { EnqueuedJobInfo } from "./handle-completed-image-build"

const cleanStaleBuildInfo = async (): Promise<EnqueuedJobInfo[]> =>
  prismaInstance.$transaction(async (tx) => {
    const possibleStaleBuildInfo = await tx.imageBuildInfo.findMany({ where: { inProgress: true } });
    if (!possibleStaleBuildInfo.length) {
      return [];
    }

    return await Promise.all(possibleStaleBuildInfo.map(async (buildInfo) => {
      const { dockerfileSHA } = buildInfo;
      if (graderImageExists(dockerfileSHA)) {
        return await handleCompletedImageBuild(dockerfileSHA, true) as EnqueuedJobInfo[];
      } else {
        await tx.imageBuildInfo.update({ where: { dockerfileSHA }, data: { inProgress: false } });
        return [];
      }
    })).then((lists) => lists.flat());
  });

export default cleanStaleBuildInfo;
