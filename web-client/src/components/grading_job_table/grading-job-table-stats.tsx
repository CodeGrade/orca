import React from "react";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import {
  WaitTimeStats,
  getWaitTimesOfQueue,
} from "../../helpers/grading-job-stats";
import { secondsToDhms } from "../../helpers/time";

const GradingJobTableStats = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  const wait_times: WaitTimeStats = getWaitTimesOfQueue(grading_job_queue);

  return (
    <div className="d-flex justify-content-center mt-3">
      <ul className="list-group list-group-horizontal text-center">
        <li className="list-group-item list-group-item-primary">
          <div className="border-bottom border-primary">Queue Size</div>
          <div>{grading_job_queue && grading_job_queue.length}</div>
        </li>
        <li className="list-group-item list-group-item-success">
          <div className="border-bottom border-success">Min Wait Time</div>
          <div>
            {grading_job_queue &&
              grading_job_queue.length > 0 &&
              secondsToDhms(wait_times.min)}
          </div>
        </li>
        <li className="list-group-item list-group-item-info">
          <div className="border-bottom border-info">Avg Wait Time</div>
          <div>
            {grading_job_queue &&
              grading_job_queue.length > 0 &&
              secondsToDhms(wait_times.avg)}
          </div>
        </li>
        <li className="list-group-item list-group-item-danger">
          <div className="border-bottom border-danger">Max Wait Time</div>
          <div>
            {grading_job_queue &&
              grading_job_queue.length > 0 &&
              secondsToDhms(wait_times.max)}
          </div>
        </li>
      </ul>
    </div>
  );
};
export default GradingJobTableStats;
