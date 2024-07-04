import { Job, Prisma, Reservation } from "@prisma/client"
import prismaInstance from "../prisma-instance";
import { getAssociatedReservation } from "../utils";

export interface JobQueueStatus {
  job: Job,
  reservation: Reservation,
  numReservationsAhead: number
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
      numReservationsAhead: await getNumberReservationsAhead(reservation, tx)
    }
  });

const getNumberReservationsAhead = async (reservation: Reservation, tx: Prisma.TransactionClient): Promise<number> => {
  const rowNumberQuery = `SELECT ROW_NUMBER()
    OVER ( ORDER BY release_at )
    FROM "Reservation"
    WHERE "id" = ${reservation.id};`

  const { rowNumber: rowNumberAsBigInt } = (await tx.$queryRaw(
    Prisma.sql([rowNumberQuery])
  ) as [{ rowNumber: number }])[0];

  return Number(rowNumberAsBigInt);
}

export default getJobQueueStatus;
