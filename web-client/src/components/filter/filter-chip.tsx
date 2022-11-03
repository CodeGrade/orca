import React from "react";

type FilterChipProps = {
  filterType: string;
  filterValue: string;
  handleRemove: (filterValue: string, filterType: string) => void;
};

/**
 * Filter chip component that displays a single active filter.
 * Each chip displays a filter type and a value.
 */
const FilterChip = ({
  filterType,
  filterValue,
  handleRemove,
}: FilterChipProps) => {
  return (
    <div className="filter-chip">
      <div className="d-flex align-items-center">
        <div className="d-flex flex-column text-center">
          <div className="filter-chip-type">{filterType}</div>
          <div className="filter-chip-value">{filterValue}</div>
        </div>
        <div
          className="close-btn"
          onClick={() => handleRemove(filterType, filterValue)}
        >
          &times;
        </div>
      </div>
    </div>
  );
};
export default FilterChip;
