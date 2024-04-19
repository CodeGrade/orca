import { Prisma, Reservation, Job } from "@prisma/client"
import prismaInstance from "./prisma-instance"
import { GradingJobConfig } from "@codegrade-orca/common";

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

export const getAssociatedReservation = async (job: Job, tx: Prisma.TransactionClient): Promise<Reservation> => {
  if (job.submitterID === null) {
    return (await tx.reservation.findUnique({ where: { jobID: job.id } }))!;
  }

  const { rowNumber: rowNumberBigInt } = (
    await tx.$queryRaw(
      Prisma.sql(
        [jobRowIndexQuery(job.config as object as GradingJobConfig, job.submitterID)]
      )
    ) as [{ rowNumber: bigint }]
  )[0];
  // TODO: Confirm this is actually a bigint so that we don't need
  // to do unnecessary hacky conversions.
  const skip = Number(rowNumberBigInt) - 1;
  const reservation = (await tx.reservation.findFirstOrThrow({
    where: {
      submitterID: job.submitterID
    },
    skip,
    take: 1
  }))!;
  return reservation;
};

const jobRowIndexQuery = (jobConfig: GradingJobConfig, submitterID: number) => {
  // NOTE: The inner table SELECTs all jobs for a given submitter.
  // We want the row number computed among all of _those_ specific rows.
  // We then pick the particular row with the given clientKey and clientURL and
  // return its row number. Therefore, we need two separate WHERE clauses.
  return `SELECT row_number() OVER (ORDER BY t."createdAt" DESC) as "rowNumber"
          FROM (
            SELECT *
            FROM "Job" j
            WHERE j."submitterID" = ${submitterID}
          ) t
          WHERE t."clientKey" = '${jobConfig.key}' AND t."clientURL" = '${jobConfig.response_url}'
          ORDER BY t."createdAt" DESC;`;
}

export const retireReservationAndJob = async (job: Job, reservation: Reservation, tx: Prisma.TransactionClient) => {
  // The job we're about to delete (and its corresponding reservation) has a
  // submitter AND this job is their last one in the queue.
  const shouldDeleteSubmitter = job.submitterID !== null && (await tx.job.count({
    where: {
      submitterID: job.submitterID
    }
  })) === 1;

  await tx.job.delete({
    where: {
      id: job.id
    }
  });
  await tx.reservation.delete({
    where: {
      id: reservation.id
    }
  });
  if (shouldDeleteSubmitter) {
    await tx.submitter.delete({
      where: {
        id: job.submitterID as number
      }
    });
  }
};
