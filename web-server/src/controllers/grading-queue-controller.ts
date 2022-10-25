import { Request, Response } from "express";
import getGradingJobs from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import createImmediateJob from "../grading-queue/create-immediate";
import moveGradingJob from "../grading-queue/move";
import deleteGradingJob from "../grading-queue/delete";
import updateGradingJob from "../grading-queue/update";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { getGradingQueueStats } from "../grading-queue/stats";
import { getFilterInfo } from "../grading-queue/filter";
import { GradingJob } from "../grading-queue/types";
import { validateGradingJobConfig } from "../utils/validate";
import { jobInQueue, nonImmediateJobExists } from "../utils/helpers";
import createJob from "../grading-queue/create";
import { upgradeJob } from "../grading-queue/upgrade";

const errorResponse = (res: Response, status: number, errors: string[]) => {
  res.status(500);
  res.json({ errors: errors });
  return;
};

export const getGradingQueue = async (req: Request, res: Response) => {
  if (
    !req.query.limit ||
    !req.query.offset ||
    !validateOffsetAndLimit(req.query.offset, req.query.limit)
  ) {
    errorResponse(res, 400, [
      "Must send a valid offset and a limit with this request.",
    ]);
  }

  // Get Pagination Data
  const [offset, limit] = formatOffsetAndLimit(
    req.query.offset,
    req.query.limit,
  );

  const [gradingJobs, gradingJobsErr] = await getGradingJobs();
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
  if (req.query.filter_type && req.query.filter_value) {
    const filterType = req.query.filter_type;
    const filterValue = req.query.filter_value;
    // TODO: Validate filter_type and value - try catch this?
    filteredGradingJobs = gradingJobs.filter(
      (gradingJob) => gradingJob[filterType as keyof GradingJob] == filterValue,
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

  // TODO: Do we want to do filter info this way?
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

export const createOrUpdateImmediateJobController = async (
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

  const arrivalTime = new Date().getTime();
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
    const createErr = await createImmediateJob(gradingJobConfig, arrivalTime);
    if (createErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to create immediate grading job.",
      ]);
      return;
    }
  } else {
    // TODO: This can currently be overwritten by nonImmediateJobExists because SET(key, job) happens inside of functions
    // Update existing job
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
    const upgradeErr = await upgradeJob(gradingJobConfig, arrivalTime);
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

export const createOrUpdateJobController = async (
  req: Request,
  res: Response,
) => {
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
      "An internal server error occurred while trying to create immediate grading job.",
    ]);
    return;
  }
  if (!jobExists) {
    // Create job if it doesn't already exist
    const arrivalTime = new Date().getTime();
    const createErr = await createJob(gradingJobConfig, arrivalTime);
    if (createErr) {
      errorResponse(res, 500, [
        "An internal server error occurred while trying to create grading job.",
      ]);
      return;
    }
  } else {
    // Update existing job
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

export const moveJobController = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  // TODO: Validate request format in middleware (req.body)
  const [new_release_at, move_grading_job_err] = await moveGradingJob(
    submission_id,
    req.body,
  );
  if (move_grading_job_err) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to move the grading job.  Please try again or contact an administrator",
      ],
    });
    return;
  }

  res.status(200);
  res.json(new_release_at);
};

export const deleteJobController = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const status: number = await deleteGradingJob(submission_id);
  res.status(200);
  res.json(status);
};
