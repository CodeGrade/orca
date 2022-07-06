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
    <div className="d-flex justify-content-around">
      <div
        className={`bg-success rounded clickable-icon px-2 ${
          released ? "invisible" : "visible"
        }`}
        onClick={() => handleMoveToFront()}
      >
        Release
      </div>
      <div
        className="bg-danger rounded clickable-icon px-2"
        onClick={() => handleDelete()}
      >
        Delete
      </div>
      <div
        className={`bg-warning rounded clickable-icon px-2 ${
          last || released ? "invisible" : "visible"
        }`}
        onClick={() => handleMoveToBack()}
      >
        To Back
      </div>
    </div>
  );
};
export default GradingJobActions;
