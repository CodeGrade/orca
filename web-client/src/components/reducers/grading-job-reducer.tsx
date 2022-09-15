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
          (grading_job: GradingJob) =>
            grading_job.timestamp !== action.timestamp
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
        (job) => job.timestamp === action.timestamp
      );
      if (!job_to_delay) return state;

      // Update priority of job in state
      const delayed_job = {
        ...job_to_delay,
        priority: action.new_priority,
      };
      const queue_with_delayed_job = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.timestamp !== action.timestamp
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
        (job) => job.timestamp === action.timestamp
      );
      if (!job_to_release) return state;
      // Update priority of job in state
      const release_job = {
        ...job_to_release,
        priority: action.new_priority,
      };

      const now: number = new Date().getTime();
      let released_ind = 0;
      for (let i = 0; i < state.grading_queue.grading_jobs.length; i++) {
        const grading_job = state.grading_queue.grading_jobs[i];
        const release_time: number = grading_job.priority;

        const is_released: boolean = release_time < now;
        if (!is_released) {
          released_ind = i;
          break;
        }
      }
      const queue_with_release_job = [
        ...state.grading_queue.grading_jobs.filter(
          (job) => job.timestamp !== action.timestamp
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
