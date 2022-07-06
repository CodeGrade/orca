import React, { useEffect } from "react";
import { getGradingJobQueue } from "../../actions/grading-job-actions";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { State } from "../reducers/grading-job-reducer";
import GradingJobTableStats from "../grading_job_table/grading-job-table-stats";
import GradingJobTable from "../grading_job_table/grading-job-table";

const Dashboard = () => {
  const grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    getGradingJobQueue(dispatch);
  }, []);
  return (
    <div className="container">
      <div className="row">
        <div className="mt-2">
          <GradingJobTableStats
            grading_job_queue={grading_job_queue && grading_job_queue}
          />
          <div className="d-flex justify-content-center align-items-center mt-3">
            <GradingJobTable
              grading_job_queue={grading_job_queue && grading_job_queue}
            />
          </div>
        </div>
      </div>
      {/* <div className="mt-2">
        <hr />
        <GraderStatsTable
          grading_job_queue={grading_job_queue && grading_job_queue}
        />
      </div> */}
    </div>
  );
};
export default Dashboard;
