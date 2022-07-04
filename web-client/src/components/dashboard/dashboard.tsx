import React, { useEffect } from "react";
import Queue from "../queue/queue";
import GraderStatsTable from "../graders/grader-stats-table";
import { getGradingJobQueue } from "../../actions/grading-job-actions";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { State } from "../reducers/grading-job-reducer";

const Dashboard = () => {
  const grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    getGradingJobQueue(dispatch);
  }, []);
  return (
    <div className="row">
      <div className="mt-2">
        <Queue grading_job_queue={grading_job_queue && grading_job_queue} />
      </div>
      <div className="mt-2">
        <hr />
        <GraderStatsTable
          grading_job_queue={grading_job_queue && grading_job_queue}
        />
      </div>
    </div>
  );
};
export default Dashboard;
