import { Request, Response } from "express";
import getCollatedGradingJobs from "../grading-queue/get";
import createImmediateJob from "../grading-queue/create-immediate";
import moveJobHandler from "../grading-queue/move";
import updateGradingJob from "../grading-queue/update";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { getGradingQueueStats } from "../grading-queue/stats";
import { filterGradingJobs, getFilterInfo } from "../grading-queue/filter";
import { FilterInfo, GradingJob } from "../grading-queue/types";
import {
  validateDeleteRequest,
  validateFilterInfo,
  validateFilterSettings,
  validateGradingJobConfig,
  validateMoveRequest,
} from "../utils/validate";
import { jobInQueue, nonImmediateJobExists } from "../utils/helpers";
import createJob from "../grading-queue/create";
import { upgradeJob } from "../grading-queue/upgrade";
import deleteJobHandler from "../grading-queue/delete";

const errorResponse = (res: Response, status: number, errors: string[]) => {
  res.status(status);
  res.json({ errors: errors });
  return;
};

export const getGradingJobs = async (req: Request, res: Response) => {
  if (
    !req.query.limit ||
    !req.query.offset ||
    !validateOffsetAndLimit(req.query.offset, req.query.limit)
  ) {
    errorResponse(res, 400, [
      "Must send a valid offset and a limit with this request.",
    ]);
    return;
  }

  // Get Pagination Data
  const [offset, limit] = formatOffsetAndLimit(
    req.query.offset,
    req.query.limit,
  );

  let [gradingJobs, gradingJobsErr] = await getCollatedGradingJobs();
  if (gradingJobsErr || !gradingJobs) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to retrieve the grading queue.  Please try again or contact an administrator",
    ]);
    return;
  }

  if (offset > 0 && offset >= gradingJobs.length) {
    errorResponse(res, 400, [
      "The given offset is out of range for the total number of items.",
    ]);
    return;
  }

  let filtered = false;
  let filteredGradingJobs: GradingJob[] = [];
  if (req.query.filters) {
    if (!req.query.settings) {
      errorResponse(res, 400, [
        "Must send valid filter settings with this request.",
      ]);
      return;
    }
    let filterInfo: any;
    let filterSettings: any;
    try {
      filterInfo = JSON.parse(req.query.filters as string);
      filterSettings = JSON.parse(req.query.settings as string);
    } catch (error) {
      errorResponse(res, 400, [
        "Must send valid filter info and settings with this request.",
      ]);
      return;
    }
    if (!filterInfo || !validateFilterInfo(filterInfo)) {
      errorResponse(res, 400, [
        "Must send valid filter info with this request.",
      ]);
      return;
    }
    if (!filterInfo || !validateFilterSettings(filterSettings)) {
      errorResponse(res, 400, [
        "Must send valid filter settings with this request.",
      ]);
      return;
    }

    // Filter the grading jobs
    filteredGradingJobs = filterGradingJobs(
      gradingJobs,
      filterInfo,
      filterSettings,
    );
    filtered = true;
  }

  const resGradingJobs = filtered ? filteredGradingJobs : gradingJobs;

  const paginationData = getPageFromGradingJobs(resGradingJobs, offset, limit);
  const { first, next, prev, last } = paginationData;
  const gradingJobsSlice = paginationData.data;

  // Calculate Stats for entire grading queue
  const stats = getGradingQueueStats(gradingJobs);
  const filterInfo = getFilterInfo(gradingJobs);

  // TODO: Create separate endpoint for filter info
  res.status(200);
  res.json({
    grading_jobs: gradingJobsSlice,
    first,
    next,
    prev,
    last,
    total: gradingJobsSlice.length,
    stats,
    filter_info: filterInfo,
  });
};

export const createOrUpdateImmediateJob = async (
  req: Request,
  res: Response,
) => {
  const gradingJobConfig = req.body;

  try {
    if (!validateGradingJobConfig(gradingJobConfig)) {
      errorResponse(res, 400, ["Invalid grading job configuration."]);
      return;
    }
  } catch (error) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to validate immediate grading job.",
    ]);

    return;
  }

  const { key, collation } = gradingJobConfig;
  const [jobExists, existsErr] = await jobInQueue(key);
  if (existsErr) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to create immediate grading job.",
    ]);
    return;
  }

  if (!jobExists) {
    // Create job if it doesn't already exist
    const createErr = await createImmediateJob(gradingJobConfig);
    if (createErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to create immediate grading job.",
      ]);
      return;
    }
  } else {
    // Update content of existing job
    const updateErr = await updateGradingJob(gradingJobConfig);
    if (updateErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to update immediate grading job.",
      ]);
      return;
    }
  }

  const [regJobExists, regExistsErr] = await nonImmediateJobExists(
    key,
    collation,
  );
  if (regExistsErr) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to upgrade immediate grading job.",
    ]);
    return;
  }

  if (regJobExists) {
    const upgradeErr = await upgradeJob(gradingJobConfig);
    if (upgradeErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to upgrade immediate grading job.",
      ]);
      return;
    }
  }

  res.status(200);
  res.json({ message: "OK" });
};

export const createOrUpdateJob = async (req: Request, res: Response) => {
  const gradingJobConfig = req.body;

  try {
    if (!validateGradingJobConfig(gradingJobConfig)) {
      res.status(400);
      res.json({ errors: ["Invalid grading job configuration."] });
      return;
    }
  } catch (error) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to validate grading job.",
      ],
    });
    return;
  }

  const { key } = gradingJobConfig;
  const [jobExists, existsErr] = await jobInQueue(key);
  if (existsErr) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to create grading job.",
    ]);
    return;
  }
  if (!jobExists) {
    // Create job if it doesn't already exist
    const arrivalTime = new Date().getTime();
    const createErr = await createJob(gradingJobConfig, arrivalTime);
    if (createErr) {
      console.error(createErr);
      errorResponse(res, 500, [
        "An internal server error occurred while trying to create grading job.",
      ]);
      return;
    }
  } else {
    // Update content of existing job
    const updateErr = await updateGradingJob(gradingJobConfig);
    if (updateErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to update grading job.",
      ]);
      return;
    }
  }
  res.status(200);
  res.json({ message: "OK" });
};

export const moveJob = async (req: Request, res: Response) => {
  const moveRequest = req.body.moveJobRequest;
  try {
    if (!validateMoveRequest(moveRequest)) {
      errorResponse(res, 400, ["Invalid move request."]);
      return;
    }
  } catch (error) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to validate move request.",
    ]);
    return;
  }

  const [releaseAt, moveErr] = await moveJobHandler(moveRequest);
  if (moveErr || releaseAt === null) {
    console.error(moveErr);
    errorResponse(res, 500, [
      "An internal server error occurred while trying to move grading job.",
    ]);
    return;
  }

  res.status(200);
  res.json(releaseAt);
};

export const deleteJob = async (req: Request, res: Response) => {
  const deleteRequest = req.body.deleteJobRequest;
  try {
    if (!validateDeleteRequest(deleteRequest)) {
      errorResponse(res, 400, ["Invalid delete request."]);
      return;
    }
  } catch (error) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to validate delete request.",
    ]);
    return;
  }
  const deleteErr = await deleteJobHandler(deleteRequest);
  if (deleteErr) {
    errorResponse(res, 500, [
      "An internal server error occurred while trying to delete grading job.",
    ]);
    return;
  }

  res.status(200);
  res.json({ message: "OK" });
};
