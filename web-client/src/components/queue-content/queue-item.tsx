import React from "react";

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
  return (
    <li className="list-group-item">
      <div className="card text-white bg-dark mb-3">
        <div className="card-header d-flex justify-content-between">
          <div>JOB ID: {job_id}</div>
          <div>#{queue_pos}</div>
        </div>
        <div className="card-body">
          <table className="table table-sm table-hover table-dark table-striped">
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
              <tr>
                <th scope="row">Wait Time</th>
                <td>{wait_time}</td>
              </tr>
              <tr className={`${team_id ? "d-table-row" : "d-none"}`}>
                <th scope="row">Team ID</th>
                <td>{team_id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </li>
  );
};
export default QueueItem;
