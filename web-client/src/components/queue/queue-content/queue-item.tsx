import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  deleteGradingJob,
  moveGradingJob,
} from "../../../actions/grading-job-actions";
import { formatReleaseTimestamp, convertHHMMSS } from "../../../helpers/time";
import {
  getTimeInQueue,
  getTimeUntilRelease,
} from "../../../helpers/queue-stats";

type QueueItemProps = {
  queue_pos: number;
  submission_id: number;
  grade_id: number;
  user_id?: number;
  team_id?: number;
  created_at: number;
  release: number;
  total: number;
};

const QueueItem = ({
  queue_pos,
  submission_id,
  grade_id,
  user_id,
  team_id,
  created_at,
  release,
  total,
}: QueueItemProps) => {
  const dispatch: Dispatch = useDispatch();
  const handleDelete = () => {
    deleteGradingJob(dispatch, submission_id);
    // TODO: check status
    // TODO: delete it locally
  };
  const firstInQueue = queue_pos === 1;
  const lastInQueue = queue_pos === total;

  const handleMoveToFront = () => {
    if (firstInQueue) {
      // Should never need this
      alert("Job is already first in queue");
      return;
    }
    moveGradingJob(dispatch, submission_id, "front", team_id, user_id);
  };
  const handleMoveToBack = () => {
    if (lastInQueue) {
      // Should never need this
      alert("Job is already last in queue");
      return;
    }
    moveGradingJob(dispatch, submission_id, "back", team_id, user_id);
  };

  return (
    <li className="list-group-item bg-primary border border-dark d-flex flex-column">
      <div className="d-flex align-items start flex-column"></div>
      <div className="card text-white bg-dark mb-3 rounded">
        <div className="card-header">
          <div>Position #{queue_pos}</div>
          <div>Release: {formatReleaseTimestamp(release)}</div>
        </div>
        <div className="card-body">
          <table className="table table-sm table-dark">
            <tbody>
              <tr>
                <th scope="row">Submission ID</th>
                <td>{submission_id}</td>
              </tr>
              <tr>
                <th scope="row">Grade ID</th>
                <td>{grade_id}</td>
              </tr>
              <tr className={`${user_id ? "d-table-row" : "d-none"}`}>
                <th scope="row">User ID</th>
                <td>{user_id}</td>
              </tr>
              <tr className={`${team_id ? "d-table-row" : "d-none"}`}>
                <th scope="row">Team ID</th>
                <td>{team_id}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="card-footer text-center">
          <div>Wait Time: {convertHHMMSS(getTimeInQueue(created_at))}</div>
          <div>Remaining: {convertHHMMSS(getTimeUntilRelease(release))}</div>
        </div>
      </div>
      <div className="d-flex justify-content-between mt-auto">
        <div
          className={`bg-success rounded clickable-icon px-2 ${
            firstInQueue ? "invisible" : "visible"
          }`}
          onClick={() => handleMoveToFront()}
        >
          To Front
        </div>
        <div
          className="bg-danger rounded clickable-icon px-2"
          onClick={() => handleDelete()}
        >
          Delete
        </div>
        <div
          className={`bg-warning rounded clickable-icon px-2 ${
            lastInQueue ? "invisible" : "visible"
          }`}
          onClick={() => handleMoveToBack()}
        >
          To Back
        </div>
      </div>
    </li>
  );
};
export default QueueItem;
