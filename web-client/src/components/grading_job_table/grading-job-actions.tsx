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
  // TODO: Pull out RELEASE and DELAY
  const handleRelease = () => {
    if (released) {
      // Should never need this
      alert("Job is already released");
      return;
    }
    moveGradingJob(dispatch, submission_id, nonce, "RELEASE", team_id, user_id);
  };
  const handleDelay = () => {
    if (released) {
      // Should never need this
      // Job already release
      return;
    }
    moveGradingJob(dispatch, submission_id, nonce, "DELAY", team_id, user_id);
  };
  // TODO: Abstract buttons
  return (
    <div className="d-flex align-items-center justify-content-center">
      <div>
        <button
          type="button"
          className={`btn btn-sm btn-success rounded ${
            released ? "d-none" : "d-inline"
          }`}
          onClick={() => handleRelease()}
        >
          Release
        </button>
      </div>
      <div>
        <button
          type="button"
          className={`btn btn-sm btn-warning rounded ${
            released ? "d-none" : "d-inline"
          }`}
          onClick={() => handleDelay()}
        >
          Delay
        </button>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-sm btn-danger rounded"
          onClick={() => handleDelete()}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
export default GradingJobActions;
