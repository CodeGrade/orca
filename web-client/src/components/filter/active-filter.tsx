import React, { useContext } from "react";
import Button from "react-bootstrap/Button";
import { FilterContext } from "./filter-bar";

type ActiveFilterProps = {
  filterType: string;
  filterValue: string;
  handleDelete: (filterValue: string, filterType: string) => void;
};

const ActiveFilter = ({
  filterType,
  filterValue,
  handleDelete,
}: ActiveFilterProps) => {
  return (
    <div className="border 2px solid black rounded">
      <div className="d-flex justify-content-between">
        <div>
          <div>{filterType.toUpperCase().replace("_", " ")}</div>
          <div>{filterValue}</div>
        </div>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => handleDelete(filterType, filterValue)}
        >
          X
        </Button>
      </div>
    </div>
  );
};
export default ActiveFilter;
