import React, { useContext, useEffect, useState } from "react";
import {
  getFilteredGradingJobs,
  getGradingJobs,
} from "../../actions/grading-job-actions";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import {
  createDefaultFilterOptionElem,
  createOptionElemsFromArr,
  getFilterValueOptionElems,
} from "../../utils/filter";
import { FilterInfo } from "../grading_job_table/types";
import { OffsetContext } from "../dashboard/dashboard";
import CreateFilterModal from "./create-filter-modal";

type FilterBarProps = {
  filterInfo: FilterInfo;
};

const FilterBar = ({ filterInfo }: FilterBarProps) => {
  // Create Filter Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShow = () => setShowModal(true);
  const handleHide = () => setShowModal(false);

  // Filter Settings
  const { offset, setOffset } = useContext(OffsetContext);
  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  // Generate filter type options using provided filterInfo
  const filterTypeOptions = createOptionElemsFromArr(
    Array.from(Object.keys(filterInfo))
  );
  const [filterValueOptions, setFilterValueOptions] = useState<JSX.Element[]>([
    createDefaultFilterOptionElem(),
  ]);

  const handleSetFilterValue = (filterValue: string): void => {
    setOffset(0);
    setFilterValue(filterValue);
  };

  const handleSetFilterType = (filterType: string): void => {
    if (filterType)
      setFilterValueOptions(
        getFilterValueOptionElems(filterType, filterInfo[filterType])
      );
    setFilterValue("");
    setFilterType(filterType);
  };

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (!filterType || !filterValue) getGradingJobs(dispatch, offset);
    else getFilteredGradingJobs(dispatch, filterType, filterValue, offset);
  }, [dispatch, offset, filterValue]);

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
            {filterTypeOptions}
          </select>
        </div>
        <div className={`form-group ${filterType ? "visibile" : "invisible"}`}>
          <select
            className="form-select"
            id="filter-by"
            value={filterValue}
            onChange={(event) => {
              handleSetFilterValue(event.target.value);
            }}
          >
            {filterValueOptions}
          </select>
        </div>
      </div>
      <CreateFilterModal show={showModal} onClose={handleHide} />
    </div>
  );
};
export default FilterBar;
