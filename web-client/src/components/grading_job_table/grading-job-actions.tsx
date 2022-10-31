import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { deleteJob, moveJob } from "../../actions/grading-job-actions";
import { MoveJobAction } from "../../services/types";
import { Collation } from "./types";

type GradingJobActionsProps = {
  jobKey: string;
  collation: Collation;
  nonce: string | null;
  released: boolean;
};

const GradingJobActions = ({
  jobKey,
  collation,
  nonce,
  released,
}: GradingJobActionsProps) => {
  const dispatch: Dispatch = useDispatch();
  const handleDelete = () => {
    deleteJob(dispatch, jobKey, collation, nonce);
  };
  // TODO: Pull out RELEASE and DELAY
  const handleRelease = () => {
    if (released) {
      // Should never need this
      alert("Job is already released");
      return;
    }
    moveJob(dispatch, jobKey, nonce, MoveJobAction.RELEASE, collation);
  };
  const handleDelay = () => {
    if (released) {
      // Should never need this
      // Job already release
      return;
    }
    moveJob(dispatch, jobKey, nonce, MoveJobAction.DELAY, collation);
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
