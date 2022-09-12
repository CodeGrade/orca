import { Request, Response } from "express";
import getGradingJobs from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import moveGradingJob from "../grading-queue/move";
import deleteGradingJob from "../grading-queue/delete";
import {
  validateOffsetAndLimit,
  formatOffsetAndLimit,
  getPageFromGradingQueue as getPageFromGradingJobs,
} from "../utils/pagination";
import {
  GradingJob,
  PaginationData,
  GradingQueueStats,
} from "../grading-queue/types";
import { getGradingQueueStats } from "../grading-queue/stats";

// TODO: Typing and Error handling
// TODO: Add res.status for all
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
  const [offset, limit]: [number, number] = formatOffsetAndLimit(
    req.query.offset,
    req.query.limit
  );

  const grading_jobs: GradingJob[] = await getGradingJobs();

  if (offset > 0 && offset >= grading_jobs.length) {
    res.status(400);
    res.json({
      errors: [
        "The given offset is out of range for the total number of items.",
      ],
    });
    return;
  }

  const pagination_data: PaginationData = getPageFromGradingJobs(
    grading_jobs,
    offset,
    limit
  );
  const { next, prev } = pagination_data;
  const grading_jobs_slice = pagination_data.data;

  // Calculate Stats for entire grading queue
  const stats: GradingQueueStats = getGradingQueueStats(grading_jobs);

  res.status(200);
  res.json({
    grading_jobs: grading_jobs_slice,
    next,
    prev,
    total: grading_jobs_slice.length,
    stats,
  });
};

export const addGradingJobToQueue = async (req: Request, res: Response) => {
  const grading_job_config = req.body;
  // TODO: Do something with status
  const status: number = await createGradingJob(grading_job_config);
  res.json(status);
};

export const moveGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const new_priority: number = await moveGradingJob(submission_id, req.body);
  res.json(new_priority);
};

export const deleteGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const status: number = await deleteGradingJob(submission_id);
  res.json(status);
};
