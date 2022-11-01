import React, { createContext, useEffect, useState } from "react";
import {
  getFilteredGradingJobs,
  getGradingJobs,
} from "../../actions/grading-job-actions";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import {
  FilterInfo,
  GradingJob,
  GradingJobTableInfo,
  PageInfo,
  PaginationInfo,
  State,
} from "../grading_job_table/types";
import GradingJobTableStats from "../grading_job_table/grading_job_table_stats/grading-job-table-stats";
import GradingJobTable from "../grading_job_table/grading-job-table";
import { OFFSET_START, LIMIT } from "../../utils/constants";
import PaginationBar from "../pagination/pagination-bar";
import TestingPanel from "../testing/testing-panel";
import CreateFilterModal from "../filter/create-filter-modal";
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

  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShow = () => setShowModal(true);
  const handleHide = () => setShowModal(false);

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

  const handleChangePage = (changeTo: PageInfo | null) => {
    if (!changeTo) return;
    setOffset(changeTo.offset);
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
              <PaginationBar
                paginationInfo={paginationInfo}
                clickHandler={handleChangePage}
              />
            </OffsetContext.Provider>
          </div>
        </div>
      </div>
      <TestingPanel />
      <CreateFilterModal show={showModal} onClose={handleHide} />
    </div>
  );
};
export default Dashboard;
