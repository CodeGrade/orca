import prismaInstance from "../prisma-instance"

export const imageIsBeingBuilt = async (dockerfileSHA: string): Promise<boolean> =>
  await (prismaInstance.imageBuildInfo.count({ where: { dockerfileSHA, inProgress: true }})) > 0

export const imageIsAwaitingBuild = async (dockerfileSHA: string): Promise<boolean> =>
  await (prismaInstance.imageBuildInfo.count({ where: { dockerfileSHA, inProgress: false }})) > 0
