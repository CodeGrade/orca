import { AnyAction } from "redux";
import {
  GET_GRADING_JOB_QUEUE,
  DELETE_GRADING_JOB,
  MOVE_GRADING_JOB_BACK,
  MOVE_GRADING_JOB_FRONT,
} from "../../actions/grading-job-actions";

type GradingJobConfigProps = {
  grade_id: number;
  max_retries: number;
  priority: number;
  script: string[];
  starter_code?: string;
  professor_code?: string;
  student_code: string;
  submission_id: number;
  team_id?: number;
  user_id?: number;
};

export type GradingJobProps = {
  config: GradingJobConfigProps;
  created_at: number;
  grade_id: number;
  priority: number;
  submission_id: number;
  team_id?: number;
  user_id?: number;
};

export type State = {
  grading_job_queue: GradingJobProps[];
  // active_grading_jobs:
};

const initialState: State = {
  grading_job_queue: [],
  // active_grading_jobs: [],
};

const gradingJobReducer = (state: State = initialState, action: AnyAction) => {
  switch (action.type) {
    case GET_GRADING_JOB_QUEUE:
      return (state = {
        ...state,
        grading_job_queue: action.grading_job_queue,
      });
    case DELETE_GRADING_JOB:
      return (state = {
        ...state,
        grading_job_queue: state.grading_job_queue.filter(
          (grading_job: GradingJobProps) =>
            grading_job.submission_id !== action.grading_job_submission_id
        ),
      });
    // TODO: Abstract from moving back/front
    case MOVE_GRADING_JOB_BACK:
      const job_to_move_back = state.grading_job_queue.find(
        (job) => job.submission_id === action.grading_job_submission_id
      );
      if (!job_to_move_back) return state;

      // Update priority of job in state
      const updated_job_back = {
        ...job_to_move_back,
        priority: action.new_priority,
      };
      const updated_queue_back = [
        ...state.grading_job_queue.filter(
          (job) => job.submission_id !== action.grading_job_submission_id
        ),
        updated_job_back,
      ];
      return (state = {
        ...state,
        grading_job_queue: updated_queue_back,
      });
    case MOVE_GRADING_JOB_FRONT:
      const job_to_move_front = state.grading_job_queue.find(
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
      for (let i = 0; i < state.grading_job_queue.length; i++) {
        const grading_job = state.grading_job_queue[i];
        const release_time_ms: number = grading_job.priority * 1000;
        const is_released: boolean = release_time_ms < now;
        if (!is_released) {
          released_ind = i;
          break;
        }
      }
      const updated_queue = [
        ...state.grading_job_queue.filter(
          (job) => job.submission_id !== action.grading_job_submission_id
        ),
      ];
      updated_queue.splice(released_ind, 0, updated_job);
      return (state = {
        ...state,
        grading_job_queue: updated_queue,
      });
    default:
      return state;
  }
};
export default gradingJobReducer;
