import { CollationType, Prisma } from '@prisma/client';
import { Collation, GradingJobConfig } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { immediateJobExists, submitterJobExists } from '../utils';

export const createOrUpdateJob = (jobConfig: GradingJobConfig, isImmediateJob: boolean) =>
  prismaInstance.$transaction(async (tx) => await createOrUpdateJobWithClient(jobConfig, isImmediateJob, tx));

export const createOrUpdateJobWithClient = async (jobConfig: GradingJobConfig, isImmediateJob: boolean, tx: Prisma.TransactionClient) => {
  const existingImmediateJob = await immediateJobExists(jobConfig.key, jobConfig.response_url, tx);
  const existingSubmitterJob =
    await submitterJobExists(jobConfig.key, jobConfig.response_url, tx);
  if ((existingImmediateJob &&  isImmediateJob) || existingSubmitterJob) {
    await tx.job.update({
      where: {
        clientURL_clientKey: {
          clientKey: jobConfig.key,
          clientURL: jobConfig.response_url
        }
      },
      data: {
        config: jobConfig as object
      }
    });
    return;
  }

  if (existingSubmitterJob && isImmediateJob) {
    await removeNonImmediateJob(jobConfig.collation, jobConfig.response_url, jobConfig.key, tx);
  }

  if (isImmediateJob) {
    await createImmediate(jobConfig, tx);
  } else {
    await createSubmitterJob(jobConfig, tx);
  }
}


const removeNonImmediateJob = async (collation: Collation, responseURL: string, jobKey: string, tx: Prisma.TransactionClient) => {
  const reservations = await tx.reservation.findMany({
    where: {
      submitter: {
        collationID: collation.id,
        collationType: collation.type.toUpperCase() as CollationType
      }
    },
    orderBy: {
      releaseAt: 'asc'
    }
  });
  const jobs = await tx.job.findMany({
    where: {
      submitter: {
        collationID: collation.id,
        collationType: collation.type.toUpperCase() as CollationType
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const submitterJobCount = jobs.length;
  let jobToDeleteID: number;
  let reservationToDeleteID: number;

  for (let i = 0; i < reservations.length; ++i) {
    const [job, reservation] = [jobs[i], reservations[i]];
    if (job.clientKey == jobKey && job.clientURL == responseURL) {
      jobToDeleteID = job.id;
      reservationToDeleteID = reservation.id;
      break;
    }
  }

  if (jobToDeleteID === undefined || reservationToDeleteID === undefined) {
    throw new Error(`Could not find matching reservation and job to delete for the following: ` +
      `${{...collation, responseURL, jobKey}}`);
  }

  await tx.reservation.delete({
    where: { id: reservationToDeleteID }
  });
  await tx.job.delete({
    where: { id: jobToDeleteID }
  });

  // i.e., The job we just deleted was the only one left.
  if (submitterJobCount === 1) {
    await tx.submitter.delete({
      where: {
        clientURL_collationType_collationID: {
          clientURL: responseURL,
          collationType: collation.type.toUpperCase() as CollationType,
          collationID: collation.id
        }
      }
    });
  }
};

const createImmediate = async (jobConfig: GradingJobConfig, tx: Prisma.TransactionClient) => {
  const createdJob = await tx.job.create({
    data: {
      clientKey: jobConfig.key,
      clientURL: jobConfig.response_url,
      config: jobConfig as object
    },
  });
  await tx.reservation.create({
    data: {
      jobID: createdJob.id
    }
  });
};

const createSubmitterJob = async (jobConfig: GradingJobConfig, tx: Prisma.TransactionClient) => {
  const submitter = await tx.submitter.upsert({
    where: {
      clientURL_collationType_collationID: {
        clientURL: jobConfig.response_url,
        collationType: jobConfig.collation.type.toUpperCase() as CollationType,
        collationID: jobConfig.collation.id
      }
    },
    update: {},
    create: {
      collationType: jobConfig.collation.type.toUpperCase() as CollationType,
      collationID: jobConfig.collation.id,
      clientURL: jobConfig.response_url
    }
  });

  await tx.job.create({
    data: {
      clientURL: jobConfig.response_url,
      clientKey: jobConfig.key,
      config: jobConfig as object,
      submitterID: submitter.id
    }
  });

  await tx.reservation.create({
    data: {
      releaseAt: new Date(Date.now() + jobConfig.priority),
      submitterID: submitter.id,
    }
  });
};
