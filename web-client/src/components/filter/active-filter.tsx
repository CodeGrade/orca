import React, { useContext } from "react";
import Button from "react-bootstrap/Button";
import { CreateFilterContext } from "./create-filter-modal";
import { FilterBuilderContext } from "./filter-builder";

type ActiveFilterProps = {
  filterType: string;
  filterValue: string;
  id: number;
};

const ActiveFilter = ({ filterType, filterValue, id }: ActiveFilterProps) => {
  const { newFilters: filters, setNewFilters: setFilters } =
    useContext(CreateFilterContext);

  // TODO: Abstract for use in add-filter.tsx
  const handleRemove = () => {
    const updatedFilters = {
      ...filters,
    };
    updatedFilters[filterType] = updatedFilters[filterType].filter(
      (value) => value !== filterValue
    );
    if (updatedFilters[filterType].length === 0)
      delete updatedFilters[filterType];
    setFilters(updatedFilters);
  };
  return (
    <div className="d-flex my-2 confirmed-filter">
      <div>Filter</div>
      <div>{filterType}</div>
      <div>{filterValue}</div>
      <Button variant="danger" onClick={() => handleRemove()}>
        &times;
      </Button>
    </div>
  );
};
export default ActiveFilter;
