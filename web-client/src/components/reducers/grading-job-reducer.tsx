import { AnyAction } from "redux";
import {
  GET_GRADING_JOB_QUEUE,
  DELETE_GRADING_JOB,
  MOVE_GRADING_JOB_BACK,
  MOVE_GRADING_JOB_FRONT,
} from "../../actions/grading-job-actions";
import { State, GradingJob } from "../grading_job_table/types";

const initial_state: State = {
  grading_queue: {
    grading_jobs: [],
    prev: null,
    next: null,
    total: 0,
    stats: {
      all: { avg: 0, min: 0, max: 0, num: 0 },
      released: { avg: 0, min: 0, max: 0, num: 0 },
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
          (grading_job: GradingJob) =>
            grading_job.submission_id !== action.grading_job_submission_id
        ),
      ];
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: updated_queue_deleted,
        },
      });
    // TODO: Abstract from moving back/front
    case MOVE_GRADING_JOB_BACK:
      const job_to_move_back = state.grading_queue.grading_jobs.find(
        (job) => job.submission_id === action.grading_job_submission_id
      );
      if (!job_to_move_back) return state;

      // Update priority of job in state
      const updated_job_back = {
        ...job_to_move_back,
        priority: action.new_priority,
      };
      const updated_queue_back = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.submission_id !== action.grading_job_submission_id
        ),
        updated_job_back,
      ];
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: updated_queue_back,
        },
      });
    case MOVE_GRADING_JOB_FRONT:
      const job_to_move_front = state.grading_queue.grading_jobs.find(
        (job) => job.submission_id === action.grading_job_submission_id
      );
      if (!job_to_move_front) return state;
      // Update priority of job in state
      const updated_job = {
        ...job_to_move_front,
        priority: action.new_priority,
      };

      const now: number = new Date().getTime();
      let released_ind = 0;
      for (let i = 0; i < state.grading_queue.grading_jobs.length; i++) {
        const grading_job = state.grading_queue.grading_jobs[i];
        const release_time_ms: number = grading_job.priority * 1000;
        const is_released: boolean = release_time_ms < now;
        if (!is_released) {
          released_ind = i;
          break;
        }
      }
      const updated_queue_front = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.submission_id !== action.grading_job_submission_id
        ),
      ];
      updated_queue_front.splice(released_ind, 0, updated_job);
      return (state = {
        grading_queue: {
          ...state.grading_queue,
          grading_jobs: updated_queue_front,
        },
      });
    default:
      return state;
  }
};
export default gradingJobReducer;
