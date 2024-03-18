import ld from 'lodash';
import { GradingJob, GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { Prisma, Reservation } from '@prisma/client';

// TODO: Add ability to filter on metadata
// TODO: Add queue stats to return
const getAllGradingJobs = (): Promise<Array<GradingJob>> => prismaInstance.$transaction(async (tx) => {
  const reservations = await tx.reservation.findMany({
    include: {
      job: true,
      submitter: true
    },
    orderBy: {
      releaseAt: 'asc'
    }
  })
  const [submitterReservations, immediateReservations] = ld.partition(reservations, (r) => r.submitterID !== null)
  const immediateGradingJobs = await Promise.all(immediateReservations.map((r) => {
    if (!r.job) {
      throw new TypeError("A reservation without a submitter must have a job associated with it.");
    }
    return {...r.job.config as object as GradingJobConfig, release_at: r.releaseAt, created_at: r.createdAt} as GradingJob;
  }));

  const submitterGradingJobs = await matchSubmittersToJobs(tx, submitterReservations);

  return [...submitterGradingJobs, ...immediateGradingJobs].sort((j) => j.release_at.getTime());
});

const matchSubmittersToJobs = async (tx: Prisma.TransactionClient, reservations: Array<Reservation>): Promise<Array<GradingJob>>  => {
  const submitterToReservations: Record<number, Array<Reservation>> = {};
  reservations.forEach((r) => {
    if (r.submitterID in submitterToReservations) {
      submitterToReservations[r.submitterID].push(r);
    } else {
      submitterToReservations[r.submitterID] = [r];
    }
  });
  return await Promise.all(Object.entries(submitterToReservations).map(async ([submitterID, reservations]) => {
    const jobs = await tx.job.findMany({
      where: {
        submitterID: parseInt(submitterID)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return reservations.map((r, i) => ({...jobs[i].config as object  as GradingJobConfig, release_at: r.releaseAt} as GradingJob));
  })).then((arr) => arr.flat());
}

export default getAllGradingJobs;
