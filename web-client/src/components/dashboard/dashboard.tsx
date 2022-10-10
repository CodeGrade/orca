import React, { useEffect, useState } from "react";
import {
  getFilteredGradingQueue,
  getGradingJobQueue,
} from "../../actions/grading-job-actions";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import {
  FilterInfo,
  GradingJob,
  GradingQueue,
  State,
} from "../grading_job_table/types";
import GradingJobTableStats from "../grading_job_table/grading_job_table_stats/grading-job-table-stats";
import GradingJobTable from "../grading_job_table/grading-job-table";
import { OFFSET_START, LIMIT } from "../../utils/constants";
import {
  createDefaultFilterOption,
  getActiveOptions,
} from "../../utils/filter";
import TestingPanel from "../testing/testing-panel";

const Dashboard = () => {
  const [offset, setOffset] = useState(OFFSET_START);

  const [filter_type, setFilterType] = useState("none");
  const [filter_value, setFilterValue] = useState("");
  const [filter_options, setFilterOptions] = useState([
    createDefaultFilterOption(),
  ]);

  const grading_queue: GradingQueue = useSelector(
    (state: State) => state.grading_queue
  );

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (filter_type === "none" || filter_value === "")
      getGradingJobQueue(dispatch, offset);
    else getFilteredGradingQueue(dispatch, filter_type, filter_value, offset);
  }, [dispatch, offset, filter_value]);

  const grading_jobs: GradingJob[] = grading_queue.grading_jobs;
  const { first, prev, next, last, total, stats } = grading_queue;

  const handleFirstPage = () => {
    if (!first) return;
    setOffset(first.offset);
  };
  const handleLastPage = () => {
    if (!last) return;
    setOffset(last.offset);
  };
  const handleNextPage = () => {
    if (!next) return;
    setOffset(next.offset);
  };
  const handlePrevPage = () => {
    if (!prev) return;
    setOffset(prev.offset);
  };

  const handleSetFilter = (filter: string) => {
    setFilterOptions(
      getActiveOptions(
        filter,
        grading_queue.filter_info[filter as keyof FilterInfo]
      )
    );
    setFilterValue("");
    setFilterType(filter);
  };

  return (
    <div className="container">
      <div className="row">
        <div className="mt-2">
          <div>
            <GradingJobTableStats stats={stats && stats} />
          </div>
          {/* TODO: Pull this out as a component */}
          <div className="mt-3 d-flex flex-column">
            {/* Start filter */}
            <div className="form-group">
              <div className="input-group mb-3">
                <label htmlFor="filter-by">
                  <span className="input-group-text bg-dark text-white me-1">
                    Filter
                  </span>
                </label>
                <div className="form-group">
                  <select
                    className="form-select"
                    id="filter-by"
                    value={filter_type}
                    onChange={(event) => {
                      handleSetFilter(event.target.value);
                    }}
                  >
                    <option value={"none"}>None</option>
                    <option value={"grader_id"}>Grader</option>
                    <option value={"course_id"}>Course</option>
                  </select>
                </div>
                <div
                  className={`form-group ${
                    filter_type !== "none" ? "visibile" : "invisible"
                  }`}
                >
                  <select
                    className="form-select"
                    id="filter-by"
                    value={filter_value}
                    onChange={(event) => {
                      setFilterValue(event.target.value);
                    }}
                  >
                    {filter_options}
                  </select>
                </div>
              </div>
            </div>
            {/* End filter */}
            <GradingJobTable grading_jobs={grading_jobs && grading_jobs} />
            <div className="d-flex justify-content-between">
              <div>
                <button
                  type="button"
                  className={`btn btn-primary ${
                    first ? "visible" : "invisible"
                  }`}
                  onClick={() => handleFirstPage()}
                >
                  {"<<"}
                </button>
                <button
                  type="button"
                  className={`btn btn-primary ${
                    prev ? "visible" : "invisible"
                  }`}
                  onClick={() => handlePrevPage()}
                >
                  {"<"}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className={`btn btn-primary ${
                    next ? "visible" : "invisible"
                  }`}
                  onClick={() => handleNextPage()}
                >
                  {">"}
                </button>
                <button
                  type="button"
                  className={`btn btn-primary ${
                    last ? "visible" : "invisible"
                  }`}
                  onClick={() => handleLastPage()}
                >
                  {">>"}
                </button>
              </div>
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
      <TestingPanel />
    </div>
  );
};
export default Dashboard;
