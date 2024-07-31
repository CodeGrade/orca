import { GraderImageBuildRequest } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';

const enqueueImageBuild = ({ dockerfile_sha_sum, dockerfile_contents, response_url }: GraderImageBuildRequest): Promise<boolean> => {
  return prismaInstance.$transaction(async (tx) => {
    const buildInfoAlreadyExists = (await tx.imageBuildInfo.count({
      where: {
        dockerfileSHA: dockerfile_sha_sum,
      }
    })) > 0;
    if (buildInfoAlreadyExists) {
      return false;
    } else {
      await tx.imageBuildInfo.create({
        data: {
          dockerfileSHA: dockerfile_sha_sum,
          dockerfileContent: dockerfile_contents,
          responseURL: response_url,
        }
      });
      return true;
    }
  });
};

export default enqueueImageBuild;
