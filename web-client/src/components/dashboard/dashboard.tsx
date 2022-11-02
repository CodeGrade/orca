import React, { createContext, useState } from "react";
import { useSelector } from "react-redux";
import {
  GradingJob,
  GradingJobTableInfo,
  PaginationInfo,
  State,
} from "../grading_job_table/types";
import GradingJobTableStats from "../grading_job_table/grading_job_table_stats/grading-job-table-stats";
import GradingJobTable from "../grading_job_table/grading-job-table";
import { OFFSET_START } from "../../utils/constants";
import PaginationBar from "../pagination/pagination-bar";
import TestingPanel from "../testing/testing-panel";
import FilterBar from "../filter/filter-bar";

export const OffsetContext = createContext<{
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
}>({
  offset: OFFSET_START,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setOffset: () => {},
});

const Dashboard = () => {
  const [offset, setOffset] = useState<number>(OFFSET_START);

  const gradingTableInfo: GradingJobTableInfo = useSelector(
    (state: State) => state.grading_table_info
  );

  const gradingJobs: GradingJob[] = gradingTableInfo.grading_jobs;
  const { first, prev, next, last, total, stats } = gradingTableInfo;
  // TODO: replace once backend sends over PaginationInfo format
  const paginationInfo: PaginationInfo = {
    first,
    prev,
    next,
    last,
  };

  return (
    <div className="container">
      <div className="row">
        <div className="mt-2">
          <div>
            <GradingJobTableStats stats={stats} />
          </div>
          <div className="mt-3 d-flex flex-column">
            <OffsetContext.Provider value={{ offset, setOffset }}>
              <FilterBar filterInfo={gradingTableInfo.filter_info} />
              <GradingJobTable gradingJobs={gradingJobs} />
              <PaginationBar paginationInfo={paginationInfo} />
            </OffsetContext.Provider>
          </div>
        </div>
      </div>
      <TestingPanel />
    </div>
  );
};
export default Dashboard;
