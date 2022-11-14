import React from "react";
import Button from "react-bootstrap/Button";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { deleteJob, moveJob } from "../../actions/grading-job-actions";
import { MoveJobAction } from "../../services/types";
import { Collation } from "./types";

interface GradingJobActionsProps {
  jobKey: string;
  collation: Collation;
  nonce: string | null;
  released: boolean;
}

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
  const handleMoveJob = (action: MoveJobAction) => {
    if (released || !nonce) {
      // Job already released
      return;
    }
    moveJob(dispatch, jobKey, nonce, action, collation);
  };
  // TODO: Abstract buttons
  return (
    <div className="d-flex align-items-center justify-content-center">
      <div>
        <Button
          variant="success"
          size="sm"
          className={`rounded ${released ? "d-none" : "d-inline"}`}
          onClick={() => handleMoveJob(MoveJobAction.RELEASE)}
        >
          Release
        </Button>
      </div>
      <div>
        <Button
          variant="warning"
          size="sm"
          className={`rounded ${released ? "d-none" : "d-inline"}`}
          onClick={() => handleMoveJob(MoveJobAction.DELAY)}
        >
          Delay
        </Button>
      </div>
      <div>
        <Button
          variant="danger"
          size="sm"
          className="rounded"
          onClick={() => handleDelete()}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
export default GradingJobActions;
