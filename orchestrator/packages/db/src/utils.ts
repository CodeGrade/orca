import { CollationType, Prisma } from "@prisma/client"
import prismaInstance from "./prisma-instance"

export const submitterJobExists = async (collationType: 'user'|'team', collationID: string, jobKey: string, responseURL: string, tx?: Prisma.TransactionClient) => {
  const client = tx ?? prismaInstance;
  return (await client.job.count(
    {
      where: {
        submitter: {
          collationID,
          collationType: collationType.toUpperCase() as CollationType,
        },
        clientKey: jobKey,
        clientURL: responseURL
      }
    }
  )) > 0;
}

export const immediateJobExists = async (jobKey: string, responseURL: string, tx?: Prisma.TransactionClient) => {
  const client = tx ?? prismaInstance;
  return (await client.reservation.count(
    {
      where: {
        job: {
          clientURL: responseURL,
          clientKey: jobKey
        }
      }
    }
  )) > 0;
}
