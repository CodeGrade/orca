import React, { useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { ActiveFilterContext, OffsetContext } from "../dashboard/dashboard";
import { FilterInfo } from "../grading_job_table/types";
import FilterChip from "./filter-chip";
import CreateFilterModal from "./create-filter-modal";

type FilterBarProps = {
  filterInfo: FilterInfo;
};

/**
 * Main filter component. Displays active filters and provides access to
 * filter creation modal.
 */
const FilterBar = ({ filterInfo }: FilterBarProps) => {
  const { activeFilters, setActiveFilters } = useContext(ActiveFilterContext);
  const { setOffset } = useContext(OffsetContext);

  // Interacting with modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const handleShow = () => setShowModal(true);
  const handleHide = () => setShowModal(false);

  // TODO: Abstract this for use in add-filter.tsx
  /**
   * Handles removing given filter from the active filters.
   * @param filterType - Type of filter to remove value from.
   * @param filterValue - Value of filter type being removed.
   */
  const handleRemoveFilter = (
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

  const handleRemoveAllFilters = () => {
    setActiveFilters({});
  };

  useEffect(() => {
    // Go back to first page whenever active filters change
    setOffset(0);
  }, [activeFilters]);

  return (
    <div>
      <div className="mb-3 mx-0 row align-items-center">
        <div className="col-2 p-0">
          <Button variant="info" onClick={() => handleShow()}>
            Filter
          </Button>
          <Button
            variant="danger"
            onClick={() => handleRemoveAllFilters()}
            className={`${
              Object.keys(activeFilters).length === 0 ? "d-none" : "d-inline"
            }`}
          >
            &times;
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
                    handleRemove={handleRemoveFilter}
                  />
                );
              });
            }
          )}
        </div>
      </div>
      <CreateFilterModal
        filterInfo={filterInfo}
        show={showModal}
        onHide={handleHide}
      />
    </div>
  );
};
export default FilterBar;
