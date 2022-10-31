import { AnyAction } from "redux";
import {
  GET_GRADING_JOBS,
  DELETE_GRADING_JOB,
  DELAY_GRADING_JOB,
  RELEASE_GRADING_JOB,
} from "../../actions/grading-job-actions";
import { State, GradingJob } from "../grading_job_table/types";

const initialState: State = {
  grading_table_info: {
    grading_jobs: [],
    prev: null,
    next: null,
    first: null,
    last: null,
    total: 0,
    stats: {
      all: { avg: 0, min: 0, max: 0, num: 0 },
      released: { avg: 0, min: 0, max: 0, num: 0 },
    },
    filter_info: {
      course_id: [],
      grader_id: [],
    },
  },
};

const findGradingJobInArrByKey = (arr: GradingJob[], key: string) => {
  return arr.find((job) => job.key === key);
};

const gradingJobReducer = (state: State = initialState, action: AnyAction) => {
  let updatedGradingJobs: GradingJob[];
  let gradingJob: GradingJob | undefined;
  const now: number = new Date().getTime();
  switch (action.type) {
    case GET_GRADING_JOBS:
      return (state = {
        ...state,
        grading_table_info: action.grading_job_queue,
      });

    case DELETE_GRADING_JOB:
      updatedGradingJobs = [
        ...state.grading_table_info.grading_jobs.filter(
          (gradingJob: GradingJob) => gradingJob.key !== action.key
        ),
      ];
      return (state = {
        grading_table_info: {
          ...state.grading_table_info,
          grading_jobs: updatedGradingJobs,
        },
      });

    case DELAY_GRADING_JOB:
      gradingJob = findGradingJobInArrByKey(
        state.grading_table_info.grading_jobs,
        action.key
      );
      if (!gradingJob) return state;

      // Update release_at of job in state
      gradingJob = {
        ...gradingJob,
        release_at: action.new_release_at,
      };
      updatedGradingJobs = [
        ...state.grading_table_info.grading_jobs.filter(
          (job) => job.key !== action.key
        ),
        gradingJob,
      ];
      return (state = {
        grading_table_info: {
          ...state.grading_table_info,
          grading_jobs: updatedGradingJobs,
        },
      });

    case RELEASE_GRADING_JOB:
      gradingJob = findGradingJobInArrByKey(
        state.grading_table_info.grading_jobs,
        action.key
      );
      if (!gradingJob) return state;

      // Update release_at of job in state
      gradingJob = {
        ...gradingJob,
        nonce: null,
        release_at: action.new_release_at,
      };

      // eslint-disable-next-line no-case-declarations
      let releasedInd = 0;
      for (const job of state.grading_table_info.grading_jobs) {
        const isReleased: boolean = job.release_at < now;
        if (!isReleased) {
          break;
        }
        releasedInd++;
      }

      updatedGradingJobs = [
        ...state.grading_table_info.grading_jobs.filter(
          (job) => job.key !== action.key
        ),
      ];
      updatedGradingJobs.splice(releasedInd, 0, gradingJob);
      return (state = {
        grading_table_info: {
          ...state.grading_table_info,
          grading_jobs: updatedGradingJobs,
        },
      });
    default:
      return state;
  }
};
export default gradingJobReducer;
