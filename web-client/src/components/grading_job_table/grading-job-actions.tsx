import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  deleteGradingJob,
  moveGradingJob,
} from "../../actions/grading-job-actions";

type GradingJobActionsProps = {
  submission_id: number;
  nonce: string;
  team_id?: number;
  user_id?: number;
  released: boolean;
};

const GradingJobActions = ({
  submission_id,
  nonce,
  team_id,
  user_id,
  released,
}: GradingJobActionsProps) => {
  const dispatch: Dispatch = useDispatch();
  const handleDelete = () => {
    deleteGradingJob(dispatch, submission_id, nonce);
  };
  const handleMoveToFront = () => {
    if (released) {
      // Should never need this
      alert("Job is already released");
      return;
    }
    moveGradingJob(dispatch, submission_id, nonce, "front", team_id, user_id);
  };
  const handleMoveToBack = () => {
    if (released) {
      // Should never need this
      // Job already release
      return;
    }
    moveGradingJob(dispatch, submission_id, nonce, "back", team_id, user_id);
  };
  return (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <div>
        <button
          type="button"
          className={`btn btn-success rounded ${
            released ? "d-none" : "d-inline"
          }`}
          onClick={() => handleMoveToFront()}
        >
          Release
        </button>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-danger rounded"
          onClick={() => handleDelete()}
        >
          Delete
        </button>
      </div>

      <div>
        <button
          type="button"
          className={`btn btn-warning rounded ${
            released ? "d-none" : "d-inline"
          }`}
          onClick={() => handleMoveToBack()}
        >
          Delay
        </button>
      </div>
    </div>
  );
};
export default GradingJobActions;
