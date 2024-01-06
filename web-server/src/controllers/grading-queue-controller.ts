import { Request, Response } from "express";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { getGradingQueueStats } from "../grading-queue/stats";
import { filterGradingJobs, getFilterInfo } from "../grading-queue/filter";
import { GradingJob } from "../grading-queue/types";
import { validateFilterRequest } from "../utils/validate";
import { errorResponse } from "./utils";
import {
  generateQueueKey,
  runOperationWithLock as runOperationsWithLock,
} from "../grading-queue/utils";
import validations from "../validations";
import QueueOperations from "../grading-queue/operations";
import { RedisTransactionBuilder } from "../grading-queue/transactions";
import { GradingQueueOperationError } from "../grading-queue/exceptions";
import { graderImageExists, touchGraderImageFile } from "../grader-images";
import { GradingJobRequestError } from "./exceptions";

export const getGradingJobs = async (req: Request, res: Response) => {
  if (
    !req.query.limit ||
    !req.query.offset ||
    !validateOffsetAndLimit(req.query.offset, req.query.limit)
  ) {
    return errorResponse(res, 400, [
      "Must send a valid offset and a limit with this request.",
    ]);
  }

  // Get Pagination Data
  const [offset, limit] = formatOffsetAndLimit(
    req.query.offset,
    req.query.limit,
  );

  try {
    const gradingJobs = await runOperationsWithLock<Array<GradingJob>>(
      async (redisConnection) => {
        return await QueueOperations.getAllGradingJobs(redisConnection);
      },
    );

    if (offset > 0 && offset >= gradingJobs.length) {
      return errorResponse(res, 400, [
        "The given offset is out of range for the total number of items.",
      ]);
    }

    let filtered = false;
    let filteredGradingJobs: GradingJob[] = [];
    // TODO: Use RequestHandler from express
    if (req.query.filter_type && req.query.filter_value) {
      const filterType = req.query.filter_type;
      const filterValue = req.query.filter_value;
      if (
        !validateFilterRequest(req.query.filter_type, req.query.filter_value)
      ) {
        return errorResponse(res, 500, ["Failed to validate filter request."]);
      }

      filteredGradingJobs = filterGradingJobs(
        gradingJobs,
        filterType as string,
        filterValue as string,
      );
      filtered = true;
    }

    const resGradingJobs = filtered ? filteredGradingJobs : gradingJobs;

    const paginationData = getPageFromGradingJobs(
      resGradingJobs,
      offset,
      limit,
    );
    const { first, next, prev, last } = paginationData;
    const gradingJobsSlice = paginationData.data;

    // Calculate Stats for entire grading queue
    const stats = getGradingQueueStats(gradingJobs);
    const filterInfo = getFilterInfo(gradingJobs);

    // TODO: Create separate endpoint for filter info
    return res.status(200).json({
      grading_jobs: gradingJobsSlice,
      first,
      next,
      prev,
      last,
      total: gradingJobsSlice.length,
      stats,
      filter_info: filterInfo,
    });
  } catch (err) {
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 500, [err.message]);
    }
    return errorResponse(res, 500, [
      `An error occurred while trying get grading jobs in the queue. Please contact an admin or professor.`,
    ]);
  }
};

export const createOrUpdateImmediateJob = async (
  req: Request,
  res: Response,
) => {
  if (!validations.gradingJobConfig(req.body)) {
    return errorResponse(res, 400, ["Invalid grading job configuration."]);
  }
  const gradingJobConfig = req.body;

  try {
    await runOperationsWithLock(async (redisConnection) => {
      const buildInProgress = false;
      const imageExists = graderImageExists(gradingJobConfig);
      if (!buildInProgress && !imageExists) {
        throw new GradingJobRequestError(
          `No image exists or is being built for SHA sum ${gradingJobConfig.grader_image_sha}.`,
        );
      }
      await touchGraderImageFile(gradingJobConfig);
      if (
        await QueueOperations.graderImageBuildInProgress(
          redisConnection,
          gradingJobConfig,
        )
      ) {
        await QueueOperations.placeJobInHoldingPen(
          new RedisTransactionBuilder(redisConnection),
          gradingJobConfig,
          true,
        );
      } else {
        const orcaKey = generateQueueKey(
          gradingJobConfig.key,
          gradingJobConfig.response_url,
        );
        await QueueOperations.createOrUpdateJob(
          redisConnection,
          new RedisTransactionBuilder(redisConnection),
          gradingJobConfig,
          orcaKey,
          Date.now(),
          true,
        );
      }
    });
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    if (
      error instanceof GradingQueueOperationError ||
      error instanceof GradingJobRequestError
    ) {
      return errorResponse(res, 400, [error.message]);
    }
    return errorResponse(res, 500, [
      `An error occurred while trying to create an 
    immediate job or update an existing one for 
    ${gradingJobConfig.collation.type} with ID ${gradingJobConfig.collation.id}.`,
    ]);
  }
};

export const createOrUpdateJob = async (req: Request, res: Response) => {
  if (!validations.gradingJobConfig(req.body)) {
    return errorResponse(res, 400, ["The given grading job was invalid."]);
  }

  const gradingJobConfig = req.body;

  try {
    await runOperationsWithLock(async (redisConnection) => {
      const buildInProgress = false;
      const imageExists = graderImageExists(gradingJobConfig);
      if (!buildInProgress && !imageExists) {
        throw new GradingJobRequestError(
          `No image exists or is being built for SHA sum ${gradingJobConfig.grader_image_sha}.`,
        );
      }
      await touchGraderImageFile(gradingJobConfig);
      if (
        await QueueOperations.graderImageBuildInProgress(
          redisConnection,
          gradingJobConfig,
        )
      ) {
        await QueueOperations.placeJobInHoldingPen(
          new RedisTransactionBuilder(redisConnection),
          gradingJobConfig,
          false,
        );
      } else {
        const orcaKey = generateQueueKey(
          gradingJobConfig.key,
          gradingJobConfig.response_url,
        );
        await QueueOperations.createOrUpdateJob(
          redisConnection,
          new RedisTransactionBuilder(redisConnection),
          gradingJobConfig,
          orcaKey,
          Date.now(),
          false,
        );
      }
    });
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    if (
      err instanceof GradingQueueOperationError ||
      err instanceof GradingJobRequestError
    ) {
      return errorResponse(res, 400, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `The following error was encountered while trying to create out update the job for the given config: ${err.message}`,
      ]);
    }
  }
};

export const moveJob = async (req: Request, res: Response) => {
  if (!validations.moveJobRequest(req.body)) {
    errorResponse(res, 400, ["Invalid move request."]);
    return;
  }
  try {
    await runOperationsWithLock(async (redisConnection) => {
      await QueueOperations.moveJob(
        redisConnection,
        new RedisTransactionBuilder(redisConnection),
        req.body,
      );
    });
    return res.status(200).json("OK");
  } catch (err) {
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 500, [err.message]);
    }
    return errorResponse(res, 500, [
      `An error occurred while trying to move job with key ${req.body.orcaKey}.`,
    ]);
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  if (!validations.deleteJobRequest(req.body)) {
    return errorResponse(res, 400, ["Invalid delete request."]);
  }
  try {
    await runOperationsWithLock(async (redisConnection) => {
      await QueueOperations.deleteJob(
        new RedisTransactionBuilder(redisConnection),
        req.body,
      );
    });
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 500, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `Something went wrong when trying to delete job with key ${req.body.orcaKey}.`,
      ]);
    }
  }
};
