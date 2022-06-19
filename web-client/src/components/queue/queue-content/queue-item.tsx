import React from "react";
import {
  deleteGradingJob,
  moveGradingJob,
} from "../../../services/grading-job-services";

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
  const handleDelete = () => {
    deleteGradingJob(job_id);
    // TODO: check status
    // TODO: delete it locally
  };
  const handleMoveToFront = () => {
    moveGradingJob(job_id, "front");
  };
  const handleMoveToBack = () => {
    moveGradingJob(job_id, "back");
  };
  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-end">
        <div onClick={() => handleDelete()}>X</div>
      </div>
      <div className="card text-white bg-dark mb-3">
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
      <div className="d-flex justify-content-between">
        <div onClick={() => handleMoveToFront()}>{"<"}-- front</div>
        <div onClick={() => handleMoveToBack()}>back --{">"}</div>
      </div>
    </li>
  );
};
export default QueueItem;
