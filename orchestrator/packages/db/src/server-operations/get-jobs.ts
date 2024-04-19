import { GradingJob, GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { Job, Reservation } from '@prisma/client';

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
  const submitterIDs = new Set(reservations.map((r) => r.submitterID).filter((id) => id !== null) as number[]);
  const submitterJobs = await tx.job.findMany({
    where: {
      submitterID: {
        in: Array.from(submitterIDs)
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const submitterIDToJobs: Map<number, Array<Job>> = Map.groupBy(submitterJobs, (j: Job) => j.submitterID!);
  return reservations.map((r) =>
    r.submitterID === null ?
      combineJobAndReservation(r, r.job!) :
      combineJobAndReservation(r, submitterIDToJobs.get(r.submitterID)!.shift()!));
});

const combineJobAndReservation = (r: Reservation, j: Job): GradingJob => ({
  ...j.config as object as GradingJobConfig,
  release_at: r.releaseAt,
  created_at: r.createdAt,
  queue_id: j.id
});

export default getAllGradingJobs;
