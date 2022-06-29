import React from "react";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  deleteGradingJob,
  moveGradingJob,
} from "../../../actions/grading-job-actions";

type QueueItemProps = {
  job_id: number;
  queue_pos: number;
  submission_id: number;
  grade_id: number;
  user_id?: number;
  team_id?: number;
  wait_time: string;
};

const QueueItem = ({
  job_id,
  queue_pos,
  submission_id,
  grade_id,
  user_id,
  team_id,
  wait_time,
}: QueueItemProps) => {
  const dispatch: Dispatch = useDispatch();
  const handleDelete = () => {
    deleteGradingJob(dispatch, job_id);
    // TODO: check status
    // TODO: delete it locally
  };
  const handleMoveToFront = () => {
    moveGradingJob(dispatch, job_id, "front");
  };
  const handleMoveToBack = () => {
    moveGradingJob(dispatch, job_id, "back");
  };
  return (
    <li className="list-group-item bg-primary border border-dark d-flex flex-column ">
      <div className="d-flex align-items start flex-column"></div>
      <div className="card text-white bg-dark mb-3 rounded">
        <div className="card-header d-flex justify-content-between">
          <div>JOB ID: {job_id}</div>
          <div>#{queue_pos}</div>
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
        <div className="card-footer">Wait Time: {wait_time}</div>
      </div>
      <div className="d-flex justify-content-between mt-auto">
        <div
          className="bg-success rounded clickable-icon px-2"
          onClick={() => handleMoveToFront()}
        >
          Front
        </div>
        <div
          className="bg-danger rounded clickable-icon px-2"
          onClick={() => handleDelete()}
        >
          Delete
        </div>
        <div
          className="bg-warning rounded clickable-icon px-2"
          onClick={() => handleMoveToBack()}
        >
          Back
        </div>
      </div>
    </li>
  );
};
export default QueueItem;
