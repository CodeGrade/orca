import React, { createContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { Container } from "react-bootstrap";
import { Dispatch } from "redux";
import { getGradingJobs } from "../../actions/grading-job-actions";

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

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    getGradingJobs(dispatch, offset);
  }, [dispatch]);

  return (
    <Container className="px-0">
      <div className="mt-2">
        <div>
          <GradingJobTableStats stats={stats} />
        </div>
        <div className="mt-3">
          <OffsetContext.Provider value={{ offset, setOffset }}>
            <FilterBar filterInfo={gradingTableInfo.filter_info} />
            <GradingJobTable gradingJobs={gradingJobs} />
            <PaginationBar paginationInfo={paginationInfo} />
          </OffsetContext.Provider>
        </div>
      </div>
      <TestingPanel />
    </Container>
  );
};
export default Dashboard;
