import { Request, Response } from "express";
import getGradingJobs from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import createImmediateGradingJob from "../grading-queue/create-immediate";
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
import { getGradingInfoKeyIfExists } from "../utils/helpers";

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

  let filtered = false;
  let filtered_grading_jobs: GradingJob[] = [];
  if (req.query.filter_type && req.query.filter_value) {
    const filter_type = req.query.filter_type;
    const filter_value = req.query.filter_value;
    // TODO: Validate filter_type and value - try catch this?
    filtered_grading_jobs = grading_jobs.filter(
      (grading_job) =>
        grading_job[filter_type as keyof GradingJob] == filter_value
    );
    filtered = true;
  }
  const res_grading_jobs = filtered ? filtered_grading_jobs : grading_jobs;

  const pagination_data = getPageFromGradingJobs(
    res_grading_jobs,
    offset,
    limit
  );
  const { first, next, prev, last } = pagination_data;
  const grading_jobs_slice = pagination_data.data;

  // Calculate Stats for entire grading queue
  const stats = getGradingQueueStats(grading_jobs);
  const filter_info = getFilterInfo(grading_jobs);

  // TODO: Do we want to do filter info this way?
  res.status(200);
  res.json({
    grading_jobs: grading_jobs_slice,
    first,
    next,
    prev,
    last,
    total: grading_jobs_slice.length,
    stats,
    filter_info: filter_info,
  });
};

export const createImmediateGradingJobController = async (
  req: Request,
  res: Response
) => {
  const grading_job_config = req.body;

  // Validate received grading job config
  try {
    // TODO: Get specific error messages here [err]
    if (!validateGradingJobConfig(grading_job_config)) {
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
  const err = await createImmediateGradingJob(grading_job_config);
  if (err) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to create the expedited grading job.  Please try again or contact an administrator",
      ],
    });
    return;
  }
  res.status(200);
  res.json({ message: "OK" });
};

export const createOrUpdateJobController = async (
  req: Request,
  res: Response
) => {
  const grading_job_config = req.body;

  try {
    if (!validateGradingJobConfig(grading_job_config)) {
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

  // Get job info key if it exists already
  const [existing_job_key, exists_err] = await getGradingInfoKeyIfExists(
    grading_job_config
  );
  if (exists_err) {
    res.status(500);
    res.json({
      errors: [
        "An internal server error occurred while trying to create the grading job.  Please try again or contact an administrator",
      ],
    });
    return;
  }

  if (existing_job_key) {
    const update_err = await updateGradingJob(
      existing_job_key,
      grading_job_config
    );
    if (update_err) {
      res.status(500);
      res.json({
        errors: [
          "An internal server error occurred while trying to update grading job.  Please try again or contact an administrator",
        ],
      });
      return;
    }
  } else {
    const create_err = await createGradingJob(grading_job_config);
    if (create_err) {
      res.status(500);
      res.json({
        errors: [
          "An internal server error occurred while trying to create grading job.  Please try again or contact an administrator",
        ],
      });
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
    req.body
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
