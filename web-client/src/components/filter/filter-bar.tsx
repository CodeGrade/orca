import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { getGradingJobs } from "../../actions/grading-job-actions";
import {
  createDefaultFilterOptionElem,
  createOptionElemsFromArr,
  getFilterValueOptionElems,
} from "../../utils/filter";
import { OffsetContext } from "../dashboard/dashboard";
import { FilterInfo } from "../grading_job_table/types";
import ActiveFilter from "./active-filter";
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
  // Create Filter Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShow = () => setShowModal(true);
  const handleHide = () => setShowModal(false);

  const [activeFilters, setActiveFilters] = useState<FilterInfo>({});

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

  const { offset } = useContext(OffsetContext);

  const noActiveFilters = (activeFilters: FilterInfo): boolean =>
    Object.keys(activeFilters).length === 0;

  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (noActiveFilters(activeFilters)) getGradingJobs(dispatch, offset);
    else getGradingJobs(dispatch, offset, activeFilters);
  }, [dispatch, offset, activeFilters]);

  return (
    <div>
      <InputGroup className="mb-3">
        <Button variant="success" onClick={() => handleShow()}>
          +
        </Button>
        <InputGroup.Text className="bg-dark text-white">
          Filters
        </InputGroup.Text>
        <div className="ms-3 d-flex gap-3">
          {Object.entries(activeFilters).map(
            ([filterType, filterValues], typeInd) => {
              return filterValues.map((filterValue, valueInd) => {
                return (
                  <ActiveFilter
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
      </InputGroup>
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
