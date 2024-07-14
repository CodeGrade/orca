import { GraderImageBuildRequest } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';

const enqueueImageBuild = ({ dockerfileSHASum, dockerfileContents, responseURL }: GraderImageBuildRequest): Promise<boolean> => {
  return prismaInstance.$transaction(async (tx) => {
    const buildInfoAlreadyExists = (await tx.imageBuildInfo.count({
      where: {
        dockerfileSHA: dockerfileSHASum,
        dockerfileContent: dockerfileContents,
        responseURL
      }
    })) > 0;
    if (buildInfoAlreadyExists) {
      return false;
    } else {
      await tx.imageBuildInfo.create({
        data: {
          dockerfileSHA: dockerfileSHASum,
          dockerfileContent: dockerfileContents,
          responseURL
        }
      });
      return true;
    }
  });
};

export default enqueueImageBuild;
