import { Dispatch } from "redux";
import * as service from "../services/grading-job-services";
import { LIMIT, OFFSET_START } from "../utils/constants";

export const GET_GRADING_JOB_QUEUE = "GET_GRADING_JOB_QUEUE";
export const DELETE_GRADING_JOB = "DELETE_GRADING_JOB";
export const RELEASE_GRADING_JOB = "RELEASE_GRADING_JOB";
export const DELAY_GRADING_JOB = "DELAY_GRADING_JOB";

// TODO: Check responses/status codes

export const getGradingJobQueue = async (
  dispatch: Dispatch,
  offset?: number,
  limit: number = LIMIT
) => {
  if (!offset) offset = OFFSET_START;
  const grading_job_queue = await service.getGradingJobQueue(limit, offset);
  dispatch({
    type: GET_GRADING_JOB_QUEUE,
    grading_job_queue,
  });
};

export const getFilteredGradingQueue = async (
  dispatch: Dispatch,
  filter_type: string,
  filter_value: string,
  offset?: number,
  limit: number = LIMIT
) => {
  if (!offset) offset = OFFSET_START;
  const grading_job_queue = await service.getFilteredGradingJobQueue(
    limit,
    offset,
    filter_type,
    filter_value
  );
  dispatch({
    type: GET_GRADING_JOB_QUEUE,
    grading_job_queue,
  });
};

export const deleteGradingJob = async (
  dispatch: Dispatch,
  submission_id: number,
  nonce: string
) => {
  const response = await service.deleteGradingJob(submission_id, nonce);
  dispatch({
    type: DELETE_GRADING_JOB,
    nonce: nonce,
  });
};

export const moveGradingJob = async (
  dispatch: Dispatch,
  submission_id: number,
  nonce: string,
  new_position: string,
  team_id?: number,
  user_id?: number
) => {
  const response = await service.moveGradingJob(
    submission_id,
    nonce,
    new_position,
    team_id,
    user_id
  );

  const new_release_at: number = response.data;
  dispatch({
    type: new_position === "RELEASE" ? RELEASE_GRADING_JOB : DELAY_GRADING_JOB,
    nonce: nonce,
    new_release_at,
  });
};
