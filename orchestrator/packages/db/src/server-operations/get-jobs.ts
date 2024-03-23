import ld, { uniq } from 'lodash';
import { GradingJob, GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { Job, Prisma, Reservation } from '@prisma/client';
import { GradingQueueOperationException } from '../exceptions';

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
  const immediateGradingJobs = immediateReservations.map((r) => {
    if (!r.job) {
      throw new GradingQueueOperationException("A reservation without a submitter must have a job associated with it.");
    }
    return { ...r.job.config as object as GradingJobConfig, release_at: r.releaseAt, created_at: r.createdAt, queue_id: r.jobID } as GradingJob;
  });

  const submitterGradingJobs = await matchSubmittersToJobs(tx, submitterReservations);

  return [...submitterGradingJobs, ...immediateGradingJobs].sort((j1, j2) => j1.release_at.getTime() - j2.release_at.getTime());
});

const matchSubmittersToJobs = async (tx: Prisma.TransactionClient, reservations: Array<Reservation>): Promise<Array<GradingJob>> => {
  const submitterIDs = uniq(reservations.map((r) => r.submitterID));
  const submitterJobs = await tx.job.findMany({
    where: {
      submitterID: {
        in: submitterIDs
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const submitterToReservations: Record<number, Array<Reservation>> = reservations.reduce((dict, r) => {
    if (r.submitterID in dict) {
      dict[r.submitterID].push(r);
    } else {
      dict[r.submitterID] = [r];
    }
    return dict;
  }, {});
  const submitterToJobs: Record<number, Array<Job>> = submitterJobs.reduce((dict, j) => {
    if (j.submitterID in dict) {
      dict[j.submitterID].push(j);
    } else {
      dict[j.submitterID] = [j];
    }
    return dict;
  }, {});

  return Object.keys(submitterToReservations).map((idString) => {
    const id = parseInt(idString);
    return submitterToReservations[id].map((r, i) => ({
      ...submitterToJobs[id][i].config as object as GradingJobConfig,
      release_at: r.releaseAt,
      created_at: r.createdAt,
      queue_id: submitterToJobs[id][i].id
    } as GradingJob));
  }).flat();

}

export default getAllGradingJobs;
