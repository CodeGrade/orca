import { CollationType, Job, Prisma } from '@prisma/client';
import { Collation, GradingJobConfig, imageWithSHAExists, toMilliseconds } from '@codegrade-orca/common';
import prismaInstance from '../prisma-instance';
import { getAssociatedReservation, immediateJobExists, retireReservationAndJob, submitterJobExists } from '../utils';
import { GradingQueueOperationException } from '../exceptions';

// TODO: Don't delete Submitters, Reservations, or Jobs. Mark them as completed
// Rails has Scopes, see what Prisma has.
// QUESTION: Should we implement this through parallel tables? Consider the
// effect of this on uniqueness constraints.

export const createOrUpdateJob = (jobConfig: GradingJobConfig, isImmediateJob: boolean) =>{
  return prismaInstance.$transaction(async (tx) => {
    const imageBuilding = (await tx.imageBuildInfo.count({
      where: {
        dockerfileSHA: jobConfig.grader_image_sha
      }
    })) > 0;

    if (!imageBuilding && !imageWithSHAExists(jobConfig.grader_image_sha)) {
      throw new GradingQueueOperationException(`No image exists or is being build with SHA sum ${jobConfig.grader_image_sha}`);
    }

    if (imageBuilding) {
      await placeJobInHoldingPen(jobConfig, tx)
    } else {
      await createOrUpdateJobWithClient(jobConfig, isImmediateJob, tx);
    }
  });
};

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
    const currentJob = await tx.job.findUnique({
      where: {
        clientURL_clientKey: {
          clientKey: jobConfig.key,
          clientURL: jobConfig.response_url
        }
      }
    }) as Job;
    const associatedReservation = await getAssociatedReservation(currentJob, tx);
    await retireReservationAndJob(currentJob, associatedReservation, tx);
  }

  if (isImmediateJob) {
    await createImmediateJob(jobConfig, tx);
  } else {
    await createSubmitterJob(jobConfig, tx);
  }
}

const placeJobInHoldingPen = async (jobConfig: GradingJobConfig, tx: Prisma.TransactionClient) => {
  await tx.jobConfigAwaitingImage.create({
    data: {
      jobConfig: jobConfig as object,
      clientKey: jobConfig.key,
      clientURL: jobConfig.response_url,
      imageBuildSHA: jobConfig.grader_image_sha
    }
  });
}

const createImmediateJob = async (jobConfig: GradingJobConfig, tx: Prisma.TransactionClient) => {
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
      // TODO: Add seconds to the prioirty in docs
      releaseAt: new Date(Date.now() + toMilliseconds(jobConfig.priority)),
      submitterID: submitter.id,
    }
  });
};
