import { AnyAction } from "redux";
import {
  GET_GRADING_JOB_QUEUE,
  DELETE_GRADING_JOB,
  DELAY_GRADING_JOB,
  RELEASE_GRADING_JOB,
} from "../../actions/grading-job-actions";
import { State, GradingJob } from "../grading_job_table/types";

const initial_state: State = {
  grading_queue: {
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

const gradingJobReducer = (state: State = initial_state, action: AnyAction) => {
  switch (action.type) {
    case GET_GRADING_JOB_QUEUE:
      return (state = {
        ...state,
        grading_queue: action.grading_job_queue,
      });
    case DELETE_GRADING_JOB:
      const updated_queue_deleted = [
        ...state.grading_queue.grading_jobs.filter(
          (grading_job: GradingJob) => grading_job.nonce !== action.nonce
        ),
      ];
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: updated_queue_deleted,
        },
      });
    // TODO: Abstract from moving back/front
    case DELAY_GRADING_JOB:
      const job_to_delay = state.grading_queue.grading_jobs.find(
        (job) => job.nonce === action.nonce
      );
      if (!job_to_delay) return state;

      // Update release_at of job in state
      const delayed_job: GradingJob = {
        ...job_to_delay,
        release_at: action.new_release_at,
      };
      const queue_with_delayed_job = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.nonce !== action.nonce
        ),
        delayed_job,
      ];
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: queue_with_delayed_job,
        },
      });
    case RELEASE_GRADING_JOB:
      const job_to_release = state.grading_queue.grading_jobs.find(
        (job) => job.nonce === action.nonce
      );
      if (!job_to_release) return state;
      // Update release_at of job in state
      const release_job: GradingJob = {
        ...job_to_release,
        release_at: action.new_release_at,
      };

      const now: number = new Date().getTime();
      let released_ind = 0;
      for (let i = 0; i < state.grading_queue.grading_jobs.length; i++) {
        const grading_job = state.grading_queue.grading_jobs[i];
        const is_released: boolean = grading_job.release_at < now;
        if (!is_released) {
          released_ind = i;
          break;
        }
      }
      const queue_with_release_job = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.nonce !== action.nonce
        ),
      ];
      queue_with_release_job.splice(released_ind, 0, release_job);
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: queue_with_release_job,
        },
      });
    default:
      return state;
  }
};
export default gradingJobReducer;
