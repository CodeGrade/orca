import { Request, Response } from "express";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { validateFilterRequest } from "../utils/validate";
import { errorResponse } from "./utils";
import { GradingJobRequestError } from "./exceptions";
import getAllGradingJobs from "../grading-queue/queries/get-grading-jobs";
import {
  GradingJob,
  GradingQueueOperationError,
  createServiceLogger,
  filterGradingJobs,
  getFilterInfo,
  getGradingQueueStats,
  validations,
} from "@codegrade-orca/common";
import mutations from "../grading-queue/mutations";

const LOGGER = createServiceLogger('grading-queue-controller');

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
    const gradingJobs = await getAllGradingJobs();
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
        return errorResponse(res, 400, ["Failed to validate filter request."]);
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
    LOGGER.error(err);
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 400, [err.message]);
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
    await mutations.createOrUpdateJob(gradingJobConfig, Date.now(), true);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    LOGGER.error(error);
    if (error instanceof GradingQueueOperationError) {
      return errorResponse(res, 400, [error.message]);
    }
    return errorResponse(res, 500, [
      "An error occurred while trying to create an immediate job or update an " +
        `existing one for ${gradingJobConfig.collation.type} with ID ${gradingJobConfig.collation.id}.`,
    ]);
  }
};

export const createOrUpdateJob = async (req: Request, res: Response) => {
  if (!validations.gradingJobConfig(req.body)) {
    return errorResponse(res, 400, ["The given grading job was invalid."]);
  }

  const gradingJobConfig = req.body;

  try {
    await mutations.createOrUpdateJob(gradingJobConfig, Date.now(), false);
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    LOGGER.error(err);
    if (err instanceof GradingQueueOperationError) {
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
    await mutations.moveJob(req.body);
    return res.status(200).json("OK");
  } catch (err) {
    LOGGER.error(err);
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 400, [err.message]);
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
    await mutations.deleteJob(req.body);
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    LOGGER.error(err);
    if (err instanceof GradingQueueOperationError) {
      return errorResponse(res, 500, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `Something went wrong when trying to delete job with key ${req.body.orcaKey}.`,
      ]);
    }
  }
};
