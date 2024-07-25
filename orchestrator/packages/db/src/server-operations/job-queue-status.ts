import { Job, Prisma, Reservation } from "@prisma/client"
import prismaInstance from "../prisma-instance";
import { getAssociatedReservation } from "../utils";

export interface JobQueueStatus {
  job: Job,
  reservation: Reservation,
  queuePosition: number
}

const getJobQueueStatus = async (key: string, responseURL: string): Promise<JobQueueStatus | null> =>
  prismaInstance.$transaction(async (tx) => {
    const job = await tx.job.findFirst({
      where: { clientKey: key, clientURL: responseURL },
      include: { reservation: true }
    });
    if (!job) { return null; }
    const reservation: Reservation = job.reservation || await getAssociatedReservation(job, tx);
    return {
      job,
      reservation,
      queuePosition: await getPositionInQueue(reservation, tx)
    }
  });

const getPositionInQueue = async (reservation: Reservation, tx: Prisma.TransactionClient): Promise<number> => {
  const rowNumberQuery = `SELECT ROW_NUMBER() OVER ( ORDER BY r."releaseAt" ) as "rowNumber"
    FROM "Reservation" r WHERE r."id" = ${reservation.id};`

  const { rowNumber: rowNumberAsBigInt } = (await tx.$queryRaw(
    Prisma.sql([rowNumberQuery])
  ) as [{ rowNumber: bigint }])[0];
  return Number(rowNumberAsBigInt);
}

export default getJobQueueStatus;
