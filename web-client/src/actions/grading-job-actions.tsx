import { Dispatch } from "redux";
import { Collation } from "../components/grading_job_table/types";
import * as service from "../services/grading-job-services";
import {
  DeleteJobRequest,
  FilterType,
  MoveJobAction,
  MoveJobRequest,
} from "../services/types";
import { LIMIT, OFFSET_START } from "../utils/constants";

export const GET_GRADING_JOBS = "GET_GRADING_JOB_QUEUE";
export const DELETE_GRADING_JOB = "DELETE_GRADING_JOB";
export const RELEASE_GRADING_JOB = "RELEASE_GRADING_JOB";
export const DELAY_GRADING_JOB = "DELAY_GRADING_JOB";

// TODO: Check responses/status codes

// TODO: Combine get and getFiltered
export const getGradingJobs = async (
  dispatch: Dispatch,
  offset?: number,
  limit: number = LIMIT
) => {
  if (!offset) offset = OFFSET_START;
  const gradingJobs = await service.getGradingJobs(limit, offset);
  dispatch({
    type: GET_GRADING_JOBS,
    grading_jobs: gradingJobs,
  });
};

export const getFilteredGradingJobs = async (
  dispatch: Dispatch,
  filterType: string, // FilterType,
  filterValue: string,
  offset?: number,
  limit: number = LIMIT
) => {
  if (!offset) offset = OFFSET_START;

  const gradingJobs = await service.getFilteredGradingJobs(
    limit,
    offset,
    filterType,
    filterValue
  );
  dispatch({
    type: GET_GRADING_JOBS,
    grading_jobs: gradingJobs,
  });
};

export const deleteJob = async (
  dispatch: Dispatch,
  jobKey: string,
  collation?: Collation,
  nonce?: string
) => {
  let deleteJobRequest: DeleteJobRequest = {
    jobKey,
  };
  if (nonce && collation) {
    deleteJobRequest = {
      ...deleteJobRequest,
      collation,
      nonce: parseInt(nonce),
    };
  }

  const response = await service.deleteJob(deleteJobRequest);
  dispatch({
    type: DELETE_GRADING_JOB,
    key: jobKey,
  });
};

export const moveJob = async (
  dispatch: Dispatch,
  jobKey: string,
  nonce: string,
  moveAction: MoveJobAction,
  collation: Collation
) => {
  const moveJobRequest: MoveJobRequest = {
    jobKey,
    nonce: parseInt(nonce),
    moveAction,
    collation,
  };
  const response = await service.moveJob(moveJobRequest);

  const new_release_at: number = response.data;
  dispatch({
    type:
      moveAction === MoveJobAction.RELEASE
        ? RELEASE_GRADING_JOB
        : DELAY_GRADING_JOB,
    key: jobKey,
    new_release_at,
  });
};
