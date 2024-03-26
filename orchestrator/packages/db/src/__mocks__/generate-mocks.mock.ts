import { GradingJobConfig, toMilliseconds } from '@codegrade-orca/common';
import { CollationType, Job, Reservation, Submitter } from '@prisma/client';

const defaultConfig: Omit<GradingJobConfig, 'key'|'collation'|'priority'> = {
  response_url: 'https://example.com/response',
  script: [
    {
      cmd: ["echo", "test"],
      on_complete: 'output'
    }
  ],
  files: {},
  metadata_table: {},
  grader_image_sha: 'hello-world:latest',
}

export const generateMockQueueInfo = (config: GradingJobConfig, isImmediateJob: boolean = false, id: number = 0): MockQueueInfo => {
  return {
    reservation: {
      id,
      jobID: id,
      createdAt: new Date(),
      releaseAt: new Date(Date.now() + toMilliseconds(id * 100)),
      submitterID: isImmediateJob ? null : id
    },
    job: {
      id,
      createdAt: new Date(),
      submitterID: isImmediateJob ? null : id,
      clientKey: config.key,
      clientURL: config.response_url,
      config: config as object
    },
    ...!isImmediateJob && { submitter: {
      id,
      collationID: config.collation.id,
      collationType: config.collation.type.toUpperCase() as CollationType
    } as Submitter}
  }
}

export const generateJobConfigs = (numJobs: number): Array<GradingJobConfig> => {
  return [...new Array(numJobs)].map((_, i) => ({
    ...defaultConfig,
    key: `${i}`,
    collation: {
      type: 'user',
      id: `${i}`
    },
    priority: i * 100
  }));
}

export const generateMultipleMockQueueInfos =
  (configs: Array<GradingJobConfig>, areImmediateJobs: boolean = false, startingID: number = 0): Array<MockQueueInfo> =>
    configs.map((c, i) => generateMockQueueInfo(c, areImmediateJobs, startingID + i));


interface MockQueueInfo {
  reservation: Reservation,
  job: Job,
  submitter?: Submitter
}

