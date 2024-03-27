import { GraderImageBuildRequest } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';

const enqueueImageBuild = ({ dockerfileSHASum, dockerfileContents }: GraderImageBuildRequest): Promise<boolean> => {
  return prismaInstance.$transaction(async (tx) => {
    const buildInfoAlreadyExists = (await tx.imageBuildInfo.count({
      where: {
        dockerfileSHA: dockerfileSHASum,
        dockerfileContent: dockerfileContents
      }
    })) > 0;
    if (buildInfoAlreadyExists) {
      return false;
    } else {
      await tx.imageBuildInfo.create({
        data: {
          dockerfileSHA: dockerfileSHASum,
          dockerfileContent: dockerfileContents
        }
      });
      return true;
    }
  });
};

export default enqueueImageBuild;
