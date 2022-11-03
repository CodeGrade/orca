import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { getGradingJobs } from "../../actions/grading-job-actions";
import { OffsetContext } from "../dashboard/dashboard";
import { FilterInfo } from "../grading_job_table/types";
import FilterChip from "./filter-chip";
import CreateFilterModal from "./create-filter-modal";

type FilterBarProps = {
  filterInfo: FilterInfo;
};

export const FilterContext = createContext<{
  activeFilters: FilterInfo;
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterInfo>>;
}>({
  activeFilters: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveFilters: () => {},
});

const FilterBar = ({ filterInfo }: FilterBarProps) => {
  const { offset, setOffset } = useContext(OffsetContext);

  // Create Filter Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShow = () => setShowModal(true);
  const handleHide = () => setShowModal(false);

  const [activeFilters, setActiveFilters] = useState<FilterInfo>({});

  // TODO: Abstract this for use in add-filter.tsx
  const handleDeleteFilter = (
    filterType: string,
    filterValue: string
  ): void => {
    const updatedActiveFilters = { ...activeFilters };
    updatedActiveFilters[filterType] = updatedActiveFilters[filterType].filter(
      (value) => value !== filterValue
    );
    // Remove property if there are no filtered values remaining
    if (updatedActiveFilters[filterType].length === 0)
      delete updatedActiveFilters[filterType];
    setActiveFilters(updatedActiveFilters);
  };

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (Object.keys(activeFilters).length === 0)
      getGradingJobs(dispatch, offset);
    else getGradingJobs(dispatch, offset, activeFilters);
    setOffset(0);
  }, [dispatch, offset, activeFilters]);

  return (
    <div>
      <div className="mb-3 mx-0 row align-items-center">
        <div className="col-2 p-0">
          <Button variant="dark" onClick={() => handleShow()}>
            Filter
          </Button>
        </div>
        <div className="col-10 d-flex gap-3 align-items-center justify-content-start overflow-auto">
          {Object.entries(activeFilters).map(
            ([filterType, filterValues], typeInd) => {
              return filterValues.map((filterValue, valueInd) => {
                return (
                  <FilterChip
                    key={`${typeInd}${valueInd}`}
                    filterType={filterType}
                    filterValue={filterValue}
                    handleDelete={handleDeleteFilter}
                  />
                );
              });
            }
          )}
        </div>
      </div>
      <FilterContext.Provider value={{ activeFilters, setActiveFilters }}>
        <CreateFilterModal
          filterInfo={filterInfo}
          show={showModal}
          onHide={handleHide}
        />
      </FilterContext.Provider>
    </div>
  );
};
export default FilterBar;
