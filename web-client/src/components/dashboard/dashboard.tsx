import React, { createContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FilterInfo,
  FilterSettings,
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

/**
 * Context for the page offset.
 * Contains the current offset along with a setter, which are required
 * for pagination and filtering.
 */
export const OffsetContext = createContext<{
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
}>({
  offset: OFFSET_START,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setOffset: () => {},
});

/**
 * Context for active filters.
 */
export const ActiveFilterContext = createContext<{
  activeFilters: FilterInfo;
  activeSettings: FilterSettings;
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterInfo>>;
  setActiveSettings: React.Dispatch<React.SetStateAction<FilterSettings>>;
}>({
  activeFilters: {},
  activeSettings: { and: false },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveFilters: () => {},
  setActiveSettings: () => {},
});

const Dashboard = () => {
  // Offset for pagination
  const [offset, setOffset] = useState<number>(OFFSET_START);

  // Filters
  // TODO: Combine into one object
  const [activeFilters, setActiveFilters] = useState<FilterInfo>({});
  const [activeSettings, setActiveSettings] = useState<FilterSettings>({
    and: false,
  });

  // Get grading table info from state
  const gradingTableInfo: GradingJobTableInfo = useSelector(
    (state: State) => state.grading_table_info
  );

  // Get the grading jobs from the grading table info
  const gradingJobs: GradingJob[] = gradingTableInfo.grading_jobs;
  // Get the pagination info
  const { first, prev, next, last, stats } = gradingTableInfo;
  // TODO: replace once backend sends over PaginationInfo format
  const paginationInfo: PaginationInfo = {
    first,
    prev,
    next,
    last,
  };

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    // Get grading jobs. Reload when offset or active filters change.
    if (Object.keys(activeFilters).length === 0)
      getGradingJobs(dispatch, offset);
    else getGradingJobs(dispatch, offset, activeFilters, activeSettings);
  }, [dispatch, offset, activeFilters, activeSettings]);

  return (
    <Container className="px-0">
      <div className="mt-2">
        <div>
          <GradingJobTableStats stats={stats} />
        </div>
        <div className="mt-3">
          <OffsetContext.Provider value={{ offset, setOffset }}>
            <ActiveFilterContext.Provider
              value={{
                activeFilters,
                activeSettings,
                setActiveFilters,
                setActiveSettings,
              }}
            >
              <FilterBar filterInfo={gradingTableInfo.filter_info} />
            </ActiveFilterContext.Provider>
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
