import { groupBy, uniq } from 'lodash';
import { GradingJob, GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { Job, Reservation } from '@prisma/client';
import { Record } from '@prisma/client/runtime/library';

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
  const submitterIDs = uniq(reservations.map((r) => r.submitterID).filter((id) => id !== null) as number[]);
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
  const submitterIDToJobs: Record<number, Array<Job>> = groupBy(submitterJobs, 'submitterID');
  return reservations.map((r) =>
    r.submitterID === null ?
      combineJobAndReservation(r, r.job as Job) :
      combineJobAndReservation(r, submitterIDToJobs[r.submitterID].shift() as Job));
});

const combineJobAndReservation = (r: Reservation, j: Job): GradingJob => ({
  ...j.config as object as GradingJobConfig,
  release_at: r.releaseAt,
  created_at: r.createdAt,
  queue_id: j.id
});

export default getAllGradingJobs;
