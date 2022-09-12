import { Dispatch } from "redux";
import * as service from "../services/grading-job-services";

export const GET_GRADING_JOB_QUEUE = "GET_GRADING_JOB_QUEUE";
export const DELETE_GRADING_JOB = "DELETE_GRADING_JOB";
export const MOVE_GRADING_JOB_FRONT = "MOVE_GRADING_JOB_FRONT";
export const MOVE_GRADING_JOB_BACK = "MOVE_GRADING_JOB_BACK";

export const getGradingJobQueue = async (dispatch: Dispatch) => {
  const grading_job_queue = await service.getGradingJobQueue();
  dispatch({
    type: GET_GRADING_JOB_QUEUE,
    grading_job_queue,
  });
};

export const deleteGradingJob = async (
  dispatch: Dispatch,
  grading_job_submission_id: number,
  nonce: string
) => {
  const response = await service.deleteGradingJob(
    grading_job_submission_id,
    nonce
  );
  dispatch({
    type: DELETE_GRADING_JOB,
    grading_job_submission_id,
  });
};

export const moveGradingJob = async (
  dispatch: Dispatch,
  grading_job_submission_id: number,
  nonce: string,
  new_position: string,
  team_id?: number,
  user_id?: number
) => {
  const response = await service.moveGradingJob(
    grading_job_submission_id,
    nonce,
    new_position,
    team_id,
    user_id
  );
  // Already at front/back
  if (response.status === 204) return;

  const new_priority: number = response.data;
  dispatch({
    type:
      new_position === "front" ? MOVE_GRADING_JOB_FRONT : MOVE_GRADING_JOB_BACK,
    grading_job_submission_id,
    new_priority,
  });
};
