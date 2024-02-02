import {
  GradingJobConfig,
  GradingQueueOperationError,
  RedisTransactionBuilder,
  createOrUpdateJobTransaction,
  generateQueueKey,
  runOperationWithLock,
} from "@codegrade-orca/common";
import {
  graderImageExists,
  touchGraderImageFile,
} from "../../utils/grader-images";

const createOrUpdateJob = async (
  jobConfig: GradingJobConfig,
  arrivalTime: number,
  isImmediateJob: boolean,
) => {
  await runOperationWithLock(async (redisConnection) => {
    const awaitingImageBuild = Boolean(
      await redisConnection.exists(jobConfig.grader_image_sha),
    );
    const imageExists = graderImageExists(jobConfig.grader_image_sha);

    if (!awaitingImageBuild && !imageExists) {
      throw new GradingQueueOperationError(
        `No image exists or is being built for SHA sum ${jobConfig.grader_image_sha}.`,
      );
    }

    const tb = new RedisTransactionBuilder(redisConnection);

    if (awaitingImageBuild) {
      await placeJobInHoldingPenTransaction(tb, jobConfig, isImmediateJob);
    } else {
      console.log("Enqueueing job as normal.");
      await touchGraderImageFile(jobConfig);
      const orcaKey = generateQueueKey(jobConfig.key, jobConfig.response_url);
      await createOrUpdateJobTransaction(
        redisConnection,
        tb,
        jobConfig,
        orcaKey,
        arrivalTime,
        isImmediateJob,
      );
    }

    const executor = await tb.build();
    await executor.execute();
  });
};

const placeJobInHoldingPenTransaction = async (
  transactionBuilder: RedisTransactionBuilder,
  jobConfig: GradingJobConfig,
  isImmediateJob: boolean,
) =>
  isImmediateJob
    ? transactionBuilder.RPUSH(
        `${jobConfig.grader_image_sha}.immediateJobs`,
        JSON.stringify(jobConfig),
      )
    : transactionBuilder.RPUSH(
        `${jobConfig.grader_image_sha}.jobs`,
        JSON.stringify(jobConfig),
      );

export default createOrUpdateJob;
