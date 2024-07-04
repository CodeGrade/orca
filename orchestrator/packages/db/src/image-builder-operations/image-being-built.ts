import prismaInstance from "../prisma-instance"

const imageIsBeingBuilt = async (dockerfileSHA: string): Promise<boolean> =>
  await (prismaInstance.imageBuildInfo.count({ where: { dockerfileSHA }})) > 0

export default imageIsBeingBuilt;
