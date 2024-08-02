import prismaInstance from '../prisma-instance';

export const jobConfigInHoldingPen = async (jobConfigID: number): Promise<boolean> =>
  Boolean(await prismaInstance.jobConfigAwaitingImage.count({ where: { id: jobConfigID } }));
