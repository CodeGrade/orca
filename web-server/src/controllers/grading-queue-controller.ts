import { Request, Response } from "express";
import getCollatedGradingJobs from "../grading-queue/get";
import moveJobHandler from "../grading-queue/move";
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
} from "../grading-queue/types";
import {
  validateDeleteRequest,
  validateFilterRequest,
  validateGradingJobConfig,
  validateMoveRequest,
} from "../utils/validate";
import { jobInQueue, nonImmediateJobExists } from "../utils/helpers";
import { upgradeJob } from "../grading-queue/upgrade";
import { OrcaRedisClient } from "../grading-queue/client";
import { RedisClientType } from "redis";
import { createOrUpdateGradingJob } from "../grading-queue/create-or-update";
import { default as deleteJobHandler } from "../grading-queue/delete";

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
  let filteredGradingJobs: EnrichedGradingJob[] = [];
  // TODO: Use RequestHandler from express
  if (req.query.filter_type && req.query.filter_value) {
    // TODO: Validate filter type and filter value
    const filterType = req.query.filter_type;
    const filterValue = req.query.filter_value;
    if (!validateFilterRequest(req.query.filter_type, req.query.filter_value)) {
      errorResponse(res, 500, ["Failed to validate filter request."]);
      return;
    }

    filteredGradingJobs = filterGradingJobs(
      gradingJobs,
      filterType as string,
      filterValue as string,
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

  if (!validateGradingJobConfig(gradingJobConfig)) {
    errorResponse(res, 400, ["Invalid grading job configuration."]);
    return;
  }

  const redisClient = new OrcaRedisClient();
  await redisClient.runOperation(
    (client: RedisClientType) =>
      createOrUpdateGradingJob(client, gradingJobConfig, true),
    true,
  );

  res.status(200);
  res.json({ message: "OK" });
};

export const createOrUpdateJob = async (req: Request, res: Response) => {
  if (!validateGradingJobConfig(req.body)) {
    return errorResponse(res, 400, ["The given grading job was invalid."]);
  }

  const gradingJob = req.body as GradingJob;

  await new OrcaRedisClient().runOperation(
    (client: RedisClientType) => createOrUpdateGradingJob(client, gradingJob),
    true,
  );
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
  if (!validateDeleteRequest(req.body.deleteJobRequest)) {
    errorResponse(res, 400, ["Invalid delete request."]);
    return;
  }
  const deleteRequest = req.body.deleteJobRequest as DeleteJobRequest;

  await new OrcaRedisClient().runOperation(
    async (client: RedisClientType) =>
      await deleteJobHandler(client, deleteRequest),
    true,
  );

  res.status(200);
  res.json({ message: "OK" });
};
