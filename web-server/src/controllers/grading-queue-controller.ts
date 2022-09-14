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
import { getGradingQueueStats } from "../grading-queue/stats";

// TODO: Error handling
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
    req.query.limit
  );

  const [grading_jobs, grading_jobs_error] = await getGradingJobs();
  if (grading_jobs_error || !grading_jobs) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to retrieve the grading queue.  Please try again or contact an administrator",
      ],
    });
    return;
  }

  if (offset > 0 && offset >= grading_jobs.length) {
    res.status(400);
    res.json({
      errors: [
        "The given offset is out of range for the total number of items.",
      ],
    });
    return;
  }

  const pagination_data = getPageFromGradingJobs(grading_jobs, offset, limit);
  const { next, prev } = pagination_data;
  const grading_jobs_slice = pagination_data.data;

  // Calculate Stats for entire grading queue
  const stats = getGradingQueueStats(grading_jobs);

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
  const status = await createGradingJob(grading_job_config);
  let json_response = {};
  switch (status) {
    case 200:
      json_response = { message: "OK" };
      break;
    case 400:
      json_response = { errors: ["Invalid grading job configuration"] };
      break;
    case 500:
      json_response = {
        errors: [
          "An internal server error occurred while trying to create the grading job.  Please try again or contact an administrator",
        ],
      };
      break;
  }
  res.status(status);
  res.json(json_response);
};

export const moveGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  // TODO: Validate request format (req.body)
  const [new_priority, move_grading_job_err] = await moveGradingJob(
    submission_id,
    req.body
  );
  if (move_grading_job_err || !new_priority) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to move the grading job.  Please try again or contact an administrator",
      ],
    });
  }

  res.status(200);
  res.json(new_priority);
};

export const deleteGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const status: number = await deleteGradingJob(submission_id);
  res.status(200);
  res.json(status);
};
