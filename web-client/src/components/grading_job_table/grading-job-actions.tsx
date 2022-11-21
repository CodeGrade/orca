import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  deleteGradingJob,
  moveGradingJob,
} from "../../actions/grading-job-actions";

type GradingJobActionsProps = {
  sub_id: number;
  team_id?: number;
  user_id?: number;
  last: boolean;
  released: boolean;
};

const GradingJobActions = ({
  sub_id,
  team_id,
  user_id,
  last,
  released,
}: GradingJobActionsProps) => {
  const dispatch: Dispatch = useDispatch();
  const handleDelete = () => {
    deleteGradingJob(dispatch, sub_id);
  };
  const handleMoveToFront = () => {
    if (released) {
      // Should never need this
      alert("Job is already released");
      return;
    }
    moveGradingJob(dispatch, sub_id, "front", team_id, user_id);
  };
  const handleMoveToBack = () => {
    if (last || released) {
      // Should never need this
      alert("Job is already last in queue");
      return;
    }
    moveGradingJob(dispatch, sub_id, "back", team_id, user_id);
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
            last || released ? "d-none" : "d-inline"
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