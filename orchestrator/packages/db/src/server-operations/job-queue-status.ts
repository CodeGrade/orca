import { Job, Prisma, Reservation } from "@prisma/client"
import prismaInstance from "../prisma-instance";
import { getAssociatedReservation } from "../utils";

export interface JobQueueStatus {
  job: Job,
  reservation: Reservation,
  queuePosition: number
}

const getJobStatus = async (jobID: number): Promise<JobQueueStatus | string | null> =>
  prismaInstance.$transaction(async (tx) => {
    const job = await tx.job.findFirst({
      where: { id: jobID },
      include: { reservation: true }
    });
    if (!job) {
      const jobInHoldingPen = Boolean(await tx.jobConfigAwaitingImage.count(
        { where: { id: jobID } }
      ));
      return jobInHoldingPen ? "This job is waiting on its grader image to be built." : null;
    }
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

export default getJobStatus;
