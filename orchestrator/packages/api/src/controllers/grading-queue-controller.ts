import { Request, Response } from "express";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { validateFilterRequest } from "../utils/validate";
import { errorResponse } from "./utils";
import {
  GradingJob,
  filterGradingJobs,
  getFilterInfo,
  getGradingQueueStats,
  validations,
} from "@codegrade-orca/common";
import {
  deleteJob as deleteJobInQueue,
  createOrUpdateJob as putJobInQueue,
  getAllGradingJobs,
  GradingQueueOperationException,
  getJobQueueStatus
} from "@codegrade-orca/db";

export const getGradingJobs = async (req: Request, res: Response) => {
  if (
    !req.query.limit ||
    !req.query.offset ||
    !validateOffsetAndLimit(req.query.offset as string, req.query.limit as string)
  ) {
    return errorResponse(res, 400, [
      "Must send a valid offset and a limit with this request.",
    ]);
  }

  // Get Pagination Data
  const [offset, limit] = formatOffsetAndLimit(
    req.query.offset as string,
    req.query.limit as string,
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
    console.error(err);
    if (err instanceof GradingQueueOperationException) {
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
    await putJobInQueue(req.body, true);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error(error);
    if (error instanceof GradingQueueOperationException) {
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

  try {
    await putJobInQueue(req.body, false);
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error(err);
    if (err instanceof GradingQueueOperationException) {
      return errorResponse(res, 400, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `The following error was encountered while trying to create out update the job for the given config: ${(err as Error).message}`,
      ]);
    }
  }
};

// TODO: Delaying a job is difficult given the way
// we order jobs by date as of now (3/22).
export const moveJob = async (_req: Request, res: Response) => {
  return errorResponse(res, 500, ["Functionality to move a job remains to be implemented. " +
    "Please contact williams.jack@northeastern.edu for more info."]);
  // if (!validations.moveJobRequest(req.body)) {
  // errorResponse(res, 400, ["Invalid move request."]);
  // return;
  // }
};

export const deleteJob = async (req: Request, res: Response) => {
  const { jobID: rawJobID } = req.params;
  try {
    const jobID = parseInt(rawJobID);
    if (isNaN(jobID)) {
      return errorResponse(res, 400, ["Given job ID is not a number."]);
    }
    await deleteJobInQueue(jobID);
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    if (err instanceof GradingQueueOperationException) {
      return errorResponse(res, 400, [err.message]);
    } else {
      return errorResponse(res, 500, [
        `Something went wrong when trying to delete job with key ${req.body.orcaKey}.`,
      ]);
    }
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  const { key, response_url } = req.body;
  const jobQueueStatus = await getJobQueueStatus(key, response_url);
  if (!jobQueueStatus) {
    return res.json("We could not find the job you're looking for. Please contact a professor or admin.");
  }
  const { reservation, numReservationsAhead } = jobQueueStatus;
  const now = new Date();
  if (now > reservation.releaseAt) {
    const minutesUntilRelease = Math.floor((now.getTime() - reservation.releaseAt.getTime()) / 60_000);
    return res.json(`Your job will be released in ${minutesUntilRelease ? (minutesUntilRelease.toString() + " minutes.") : "less than a minute."}`);
  } else if (numReservationsAhead === 0) {
    return res.json("Your job is next up to be graded.");
  } else {
    return res.json(`Your job will be graded after the next ${numReservationsAhead} jobs.`);
  }
}

