import { getAssociatedReservation, retireReservationAndJob } from "../utils";
import prismaInstance from "../prisma-instance";
import { Job } from "@prisma/client";

const deleteJob = (jobID: number) =>
  prismaInstance.$transaction(async (tx) => {
    const job = await tx.job.findUnique({
      where: {
        id: jobID
      }
    }) as Job;
    const reservation = await getAssociatedReservation(job, tx);
    await retireReservationAndJob(job, reservation, tx);
  });

export default deleteJob;
