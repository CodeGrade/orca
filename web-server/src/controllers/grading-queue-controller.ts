import { Request, Response } from "express";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { getGradingQueueStats } from "../grading-queue/stats";
import { filterGradingJobs, getFilterInfo } from "../grading-queue/filter";
import {
  DeleteJobRequest,
  EnrichedGradingJob,
  GradingJob,
  MoveJobRequest,
} from "../grading-queue/types";
import {
  validateDeleteRequest,
  validateFilterRequest,
  validateGradingJob,
  validateMoveRequest,
} from "../utils/validate";
import { GradingQueueServiceError } from "../grading-queue/service/exceptions";
import { errorResponse } from "./utils";
import { createQueueKey } from "../grading-queue/utils";
import { GradingQueueService } from "../grading-queue/service";

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
    const gradingJobs = await new GradingQueueService().getGradingJobs();

    if (offset > 0 && offset >= gradingJobs.length) {
      return errorResponse(res, 400, [
        "The given offset is out of range for the total number of items.",
      ]);
    }

    let filtered = false;
    let filteredGradingJobs: EnrichedGradingJob[] = [];
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
    if (err instanceof GradingQueueServiceError) {
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
  if (!validateGradingJob(req.body)) {
    return errorResponse(res, 400, ["Invalid grading job configuration."]);
  }
  const gradingJob = req.body as GradingJob;

  try {
    const orcaKey = createQueueKey(gradingJob.key, gradingJob.response_url);
    await new GradingQueueService().createOrUpdateJob(
      gradingJob,
      Date.now(),
      orcaKey,
      true,
    );
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    if (error instanceof GradingQueueServiceError) {
      return errorResponse(res, 500, [error.message]);
    }
    return errorResponse(res, 500, [
      `An error occurred while trying to create an 
    immediate job or update an existing one for 
    ${gradingJob.collation.type} with ID ${gradingJob.collation.id}.`,
    ]);
  }
};

export const createOrUpdateJob = async (req: Request, res: Response) => {
  if (!validateGradingJob(req.body)) {
    return errorResponse(res, 400, ["The given grading job was invalid."]);
  }

  const gradingJob = req.body as GradingJob;

  try {
    const orcaKey = createQueueKey(gradingJob.key, gradingJob.response_url);
    await new GradingQueueService().createOrUpdateJob(
      gradingJob,
      Date.now(),
      orcaKey,
      false,
    );
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err instanceof GradingQueueServiceError) {
      return errorResponse(res, 500, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `Something went wrong while trying to create or update a job 
      for ${gradingJob.collation.type} with ID ${gradingJob.collation.id}.`,
      ]);
    }
  }
};

export const moveJob = async (req: Request, res: Response) => {
  if (!validateMoveRequest(req.body.moveJobRequest)) {
    errorResponse(res, 400, ["Invalid move request."]);
    return;
  }
  const moveRequest: MoveJobRequest = req.body.moveJobRequest;

  try {
    await new GradingQueueService().moveJob(moveRequest);
    return res.status(200).json("OK");
  } catch (err) {
    if (err instanceof GradingQueueServiceError) {
      return errorResponse(res, 500, [err.message]);
    }
    return errorResponse(res, 500, [
      `An error occurred while trying to move job with key ${moveRequest.orcaKey}.`,
    ]);
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  if (!validateDeleteRequest(req.body)) {
    return errorResponse(res, 400, ["Invalid delete request."]);
  }
  const deleteRequest = req.body as DeleteJobRequest;

  try {
    await new GradingQueueService().deleteJob(deleteRequest);
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err instanceof GradingQueueServiceError) {
      return errorResponse(res, 500, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `Something went wrong when trying to delete job with key ${deleteRequest.orcaKey}.`,
      ]);
    }
  }
};
