import React, { useContext, useEffect, useState } from "react";
import {
  getFilteredGradingJobs,
  getGradingJobs,
} from "../../actions/grading-job-actions";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  createDefaultFilterOptionElem,
  getActiveOptionElems,
} from "../../utils/filter";
import { FilterInfo } from "../grading_job_table/types";
import { OffsetContext } from "../dashboard/dashboard";

type FilterBarProps = {
  filterInfo: FilterInfo;
};

const FilterBar = ({ filterInfo }: FilterBarProps) => {
  const { offset, setOffset } = useContext(OffsetContext);
  const [filterType, setFilterType] = useState<string>("none");
  const [filterValue, setFilterValue] = useState<string>("");
  const [filterOptionElems, setFilterOptionElems] = useState<JSX.Element[]>([
    createDefaultFilterOptionElem(),
  ]);

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (filterType === "none" || filterValue === "")
      getGradingJobs(dispatch, offset);
    else getFilteredGradingJobs(dispatch, filterType, filterValue, offset);
  }, [dispatch, offset, filterValue]);

  const handleSetFilterValue = (value: string): void => {
    setOffset(0);
    setFilterValue(value);
  };

  const handleSetFilterType = (filter: string): void => {
    setFilterOptionElems(
      getActiveOptionElems(filter, filterInfo[filter as keyof FilterInfo])
    );
    setFilterValue("");
    setFilterType(filter);
  };

  return (
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
            value={filterType}
            onChange={(event) => {
              handleSetFilterType(event.target.value);
            }}
          >
            <option value={"none"}>None</option>
            <option value={"grader_id"}>Grader</option>
            <option value={"course_id"}>Course</option>
          </select>
        </div>
        <div
          className={`form-group ${
            filterType !== "none" ? "visibile" : "invisible"
          }`}
        >
          <select
            className="form-select"
            id="filter-by"
            value={filterValue}
            onChange={(event) => {
              handleSetFilterValue(event.target.value);
            }}
          >
            {filterOptionElems}
          </select>
        </div>
      </div>
    </div>
  );
};
export default FilterBar;
