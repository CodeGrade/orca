import { Request, Response } from "express";
import getGradingJobs from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import createImmediateGradingJob from "../grading-queue/create-immediate";
import moveGradingJob from "../grading-queue/move";
import deleteGradingJob from "../grading-queue/delete";
import updateJob from "../grading-queue/update";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import { getGradingQueueStats } from "../grading-queue/stats";
import { getFilterInfo } from "../grading-queue/filter";
import { GradingJob } from "../grading-queue/types";
import { validateGradingJobConfig } from "../utils/validate";
import { jobInQueue } from "../utils/helpers";
import createJob from "../grading-queue/create";
import { redisGet, redisSet } from "../utils/redis";

export const getGradingQueue = async (req: Request, res: Response) => {
  if (
    !req.query.limit ||
    !req.query.offset ||
    !validateOffsetAndLimit(req.query.offset, req.query.limit)
  ) {
    res.status(400);
    res.json({
      errors: ["Must send a valid offset and a limit with this request."],
    });
    return;
  }

  // Get Pagination Data
  const [offset, limit] = formatOffsetAndLimit(
    req.query.offset,
    req.query.limit,
  );

  const [gradingJobs, gradingJobsErr] = await getGradingJobs();
  if (gradingJobsErr || !gradingJobs) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to retrieve the grading queue.  Please try again or contact an administrator",
      ],
    });
    return;
  }

  if (offset > 0 && offset >= gradingJobs.length) {
    res.status(400);
    res.json({
      errors: [
        "The given offset is out of range for the total number of items.",
      ],
    });
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

  const pageinationData = getPageFromGradingJobs(resGradingJobs, offset, limit);
  const { first, next, prev, last } = pageinationData;
  const gradingJobsSlice = pageinationData.data;

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

export const createImmediateJobController = async (
  req: Request,
  res: Response,
) => {
  const gradingJobConfig = req.body;

  // Validate received grading job config
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
        "Internal server error while validating grading job configuration.",
      ],
    });
    return;
  }
  const err = await createImmediateGradingJob(gradingJobConfig);
  if (err) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to create the grading job.",
      ],
    });
    return;
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
        "An internal server error occurred while trying to create the grading job.",
      ],
    });
    return;
  }

  const arrivalTime = new Date().getTime();
  if (!jobInQueue(gradingJobConfig.key)) {
    // Create job if it doesn't already exist
    const releaseTime = gradingJobConfig.priority + arrivalTime;
    const gradingJob: GradingJob = {
      ...gradingJobConfig,
      release_at: releaseTime,
      created_at: arrivalTime,
    };
    const createErr = await createJob(gradingJob, arrivalTime, releaseTime);
    if (createErr) {
      res.status(500);
      res.json({
        errors: [
          "An internal server error occurred while trying to create grading job.",
        ],
      });
      return;
    }
  } else {
    // Update existing job
    const updateErr = await updateJob(gradingJobConfig);
    if (updateErr) {
      res.status(500);
      res.json({
        errors: [
          "An internal server error occurred while trying to update grading job.",
        ],
      });
      return;
    }
  }

  // Success
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
