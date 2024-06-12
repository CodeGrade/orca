import { GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { createOrUpdateJobWithClient } from '../shared/create-or-update-job';
import { ImageBuildInfo, JobConfigAwaitingImage } from '@prisma/client';


export type CancelJobInfo = Pick<GradingJobConfig, 'response_url'|'key'>;

const handleCompletedImageBuild = (dockerfileSHASum: string, wasSuccessful: boolean): Promise<Array<CancelJobInfo> | null> => {
  return prismaInstance.$transaction(async (tx) => {
    const imageBuildInfo = await tx.imageBuildInfo.findUnique({
      where: {
        dockerfileSHA: dockerfileSHASum
      },
      include: {
        jobConfigs: true
      }
    }) as ImageBuildInfo & { jobConfigs: Array<JobConfigAwaitingImage> };
    let jobInfoForCancellation: Array<CancelJobInfo> | null = null;
    if (wasSuccessful) {
      await Promise.all(
        imageBuildInfo.jobConfigs.map(async (c) => {
          await createOrUpdateJobWithClient(
            c.jobConfig as object as GradingJobConfig,
            c.isImmediate, tx
          );
        })
      );
    } else {
      jobInfoForCancellation = imageBuildInfo.jobConfigs.map(
        ({clientKey, clientURL}) => ({response_url: clientURL, key: clientKey})
      );
    }
    await tx.imageBuildInfo.delete({
      where: {
        dockerfileSHA: dockerfileSHASum
      }
    });
    return jobInfoForCancellation;
  });
};

export default handleCompletedImageBuild;
