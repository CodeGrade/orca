import { ImageBuildInfo } from "@prisma/client";
import prismaInstance from "../prisma-instance";

/**
 * Retrieve the next request to build a grader image and mark it as in progress.
**/
const getNextImageBuild = (): Promise<ImageBuildInfo | null> => {
  return prismaInstance.$transaction(
    async (tx) => {
      const nextJob = await tx.imageBuildInfo.findFirst({
        where: {
          inProgress: false
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      if (nextJob === null) {
        return null;
      }
      await tx.imageBuildInfo.update({
        where: {
          dockerfileSHA: nextJob.dockerfileSHA
        },
        data: {
          inProgress: true
        }
      });
      return {...nextJob, inProgress: true};
    }
  );
};

export default getNextImageBuild;
