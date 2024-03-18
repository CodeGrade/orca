import { CollationType, Prisma } from "@prisma/client"
import prismaInstance from "./prisma-instance"

export const submitterJobExists = async (jobKey: string, responseURL: string, tx?: Prisma.TransactionClient) => {
  const client = tx ?? prismaInstance;
  return (await client.job.count({
    where: {
      clientURL: responseURL,
      clientKey: jobKey,
      submitterID: {
        not: null
      }
    }
  })) > 0;
}

export const immediateJobExists = async (jobKey: string, responseURL: string, tx?: Prisma.TransactionClient) => {
  const client = tx ?? prismaInstance;
  return (await client.reservation.count({
    where: {
      job: {
        clientKey: jobKey,
        clientURL: responseURL
      }
    }
  })) > 0;
}
