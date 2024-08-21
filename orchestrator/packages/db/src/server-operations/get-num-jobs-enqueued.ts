import prismaInstance from '../prisma-instance';

const getNumJobsEnqueued = (): Promise<number> =>
  prismaInstance.$transaction((tx) => tx.job.count());

export default getNumJobsEnqueued;
