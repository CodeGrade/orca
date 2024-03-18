import { GradingQueueOperationException } from "../exceptions";
import prismaInstance from "../prisma-instance";
import { Prisma, Reservation } from "@prisma/client";

const deleteJob = (jobID: number) => {
  return prismaInstance.$transaction(async (tx) => {

    if ((await tx.job.count({ where: { id: jobID } })) === 0) {
      throw new GradingQueueOperationException(`No job found in the queue with ID ${jobID}.`);
    }
    const isImmediateJob = (await tx.reservation.count({ where: { jobID } })) > 0
    if (isImmediateJob) {
      await tx.reservation.delete({ where: { jobID } });
      await tx.job.delete({ where: { id: jobID } });
    } else {
      await removeSubmitterJob(jobID, tx);
    }
  });
}

const removeSubmitterJob = async (jobID: number, tx: Prisma.TransactionClient) => {
  const jobToDelete = await tx.job.findUnique({
    where: {
      id: jobID
    }
  });

  const submitterReservations = await tx.reservation.findMany({
    where: {
      submitterID: jobToDelete.submitterID
    },
    orderBy: {
      releaseAt: 'asc'
    }
  });
  const submitterJobs = await tx.job.findMany({
    where: {
      submitterID: jobToDelete.submitterID
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let reservationToDelete: Reservation;
  for (let i = 0; i < submitterJobs.length; ++i) {
    if (submitterJobs[i].id === jobID) {
      reservationToDelete = submitterReservations[i];
      break;
    }
  }

  if (!reservationToDelete) {
    throw new GradingQueueOperationException(`No reservation associated with Job ID ${jobToDelete.id} and Submitter ID ${jobToDelete.submitterID}.`);
  }

  const shouldDeleteSubmitter = submitterJobs.length === 1;

  await tx.reservation.delete({ where: { id: reservationToDelete.id } });
  await tx.job.delete({ where: { id: jobToDelete.id } });
  if (shouldDeleteSubmitter) {
    await tx.submitter.delete({ where: { id: jobToDelete.submitterID } });
  }
};

export default deleteJob;
