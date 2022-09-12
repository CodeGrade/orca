import React, { useEffect, useState } from "react";
import { getGradingJobQueue } from "../../actions/grading-job-actions";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import {
  GradingJob,
  GradingQueue,
  State,
} from "../reducers/grading-job-reducer";
import GradingJobTableStats from "../grading_job_table/grading_job_table_stats/grading-job-table-stats";
import GradingJobTable from "../grading_job_table/grading-job-table";
import { OFFSET_START, LIMIT } from "../../utils/constants";

const Dashboard = () => {
  const [offset, setOffset] = useState(OFFSET_START);

  const grading_queue: GradingQueue = useSelector(
    (state: State) => state.grading_queue
  );

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    getGradingJobQueue(dispatch, offset);
  }, [dispatch, offset]);

  const grading_jobs: GradingJob[] = grading_queue.grading_jobs;
  const { prev, next, total } = grading_queue;

  const handleNextPage = () => {
    setOffset(offset + LIMIT);
  };
  const handlePrevPage = () => {
    setOffset(offset - LIMIT);
  };

  return (
    <div className="container">
      <div className="row">
        <div className="mt-2">
          <div>
            <GradingJobTableStats grading_jobs={grading_jobs && grading_jobs} />
          </div>

          <div className="mt-3 d-flex flex-column">
            <GradingJobTable grading_jobs={grading_jobs && grading_jobs} />
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className={`btn btn-primary ${prev ? "visible" : "invisible"}`}
                onClick={() => handlePrevPage()}
              >
                {"<"}---
              </button>
              <button
                type="button"
                className={`btn btn-primary ${next ? "visible" : "invisible"}`}
                onClick={() => handleNextPage()}
              >
                ---{">"}
              </button>
            </div>
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
