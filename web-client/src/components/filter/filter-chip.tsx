import React from "react";

type FilterChipProps = {
  filterType: string;
  filterValue: string;
  handleDelete: (filterValue: string, filterType: string) => void;
};

const FilterChip = ({
  filterType,
  filterValue,
  handleDelete,
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
          onClick={() => handleDelete(filterType, filterValue)}
        >
          &times;
        </div>
      </div>
    </div>
  );
};
export default FilterChip;
