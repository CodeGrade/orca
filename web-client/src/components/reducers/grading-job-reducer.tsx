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
  created_at: string;
  grade_id: number;
  id: number;
  priority: number;
  submission_id: number;
  team_id?: number;
  user_id?: number;
  updated_at: string;
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
            grading_job.id !== action.grading_job_id
        ),
      });
    // TODO: Abstract from moving back/front
    case MOVE_GRADING_JOB_BACK:
      const job_to_move_back = state.grading_job_queue.find(
        (job) => job.id === action.grading_job_id
      );
      if (job_to_move_back) {
        // Update priority of job in state
        const updated_job = {
          ...job_to_move_back,
          priority: action.new_priority,
        };
        const updated_queue = [
          ...state.grading_job_queue.filter(
            (job) => job.id !== action.grading_job_id
          ),
          updated_job,
        ];
        return (state = {
          ...state,
          grading_job_queue: updated_queue,
        });
      }
      return state;
    case MOVE_GRADING_JOB_FRONT:
      const job_to_move_front = state.grading_job_queue.find(
        (job) => job.id === action.grading_job_id
      );
      if (job_to_move_front) {
        // Update priority of job in state
        const updated_job = {
          ...job_to_move_front,
          priority: action.new_priority,
        };
        const updated_queue = [
          updated_job,
          ...state.grading_job_queue.filter(
            (job) => job.id !== action.grading_job_id
          ),
        ];
        return (state = {
          ...state,
          grading_job_queue: updated_queue,
        });
      }
      return state;
    default:
      return state;
  }
};
export default gradingJobReducer;
