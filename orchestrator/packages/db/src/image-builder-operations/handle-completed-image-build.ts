import { GradingJobConfig, JobStatus } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { createOrUpdateJobWithClient } from '../shared/create-or-update-job';
import { ImageBuildInfo, JobConfigAwaitingImage } from '@prisma/client';


export type CancelJobInfo = Pick<GradingJobConfig, 'response_url' | 'key'>;
export type EnqueuedJobInfo = JobStatus & Pick<GradingJobConfig, 'response_url' | 'key'>;

const handleCompletedImageBuild = (dockerfileSHASum: string, wasSuccessful: boolean): Promise<Array<CancelJobInfo | EnqueuedJobInfo>> => {
  return prismaInstance.$transaction(async (tx) => {
    const imageBuildInfo = await tx.imageBuildInfo.findUnique({
      where: {
        dockerfileSHA: dockerfileSHASum
      },
      include: {
        jobConfigs: true
      }
    }) as ImageBuildInfo & { jobConfigs: Array<JobConfigAwaitingImage> };
    let jobInfo: Array<CancelJobInfo | EnqueuedJobInfo> = [];
    if (wasSuccessful) {
      jobInfo = await Promise.all(
        imageBuildInfo.jobConfigs.map(async (c) => {
          const status = await createOrUpdateJobWithClient(
            c.jobConfig as object as GradingJobConfig,
            c.isImmediate, tx
          );
          return { ...status, response_url: c.clientURL, key: c.clientKey };
        })
      );
    } else {
      jobInfo = imageBuildInfo.jobConfigs.map(
        ({ clientKey, clientURL }) => ({ response_url: clientURL, key: clientKey })
      );
    }
    await tx.imageBuildInfo.delete({
      where: {
        dockerfileSHA: dockerfileSHASum
      }
    });
    return jobInfo;
  });
};

export default handleCompletedImageBuild;
