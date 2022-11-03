import React, { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { CreateFilterContext } from "./create-filter-modal";

type ActiveFilterProps = {
  filterType: string;
  filterValue: string;
};

/**
 * Component for displaying and interacting with currently active
 * filters in the FilterBuilder.
 */
const ActiveFilter = ({ filterType, filterValue }: ActiveFilterProps) => {
  // Filters being configured
  const { newFilters, setNewFilters } = useContext(CreateFilterContext);

  // Indicates if the active filter was removed from within Modal
  const [removed, setRemoved] = useState<boolean>(false);

  // TODO: Abstract for use in new-filter.tsx
  /**
   * Handles removing this active filter.
   */
  const handleRemove = () => {
    // Update FilterInfo being configured
    const updatedFilters = {
      ...newFilters,
    };
    updatedFilters[filterType] = updatedFilters[filterType].filter(
      (value) => value !== filterValue
    );
    if (updatedFilters[filterType].length === 0)
      delete updatedFilters[filterType];
    setNewFilters(updatedFilters);
    // Hide element
    setRemoved(true);
  };
  return (
    <div className={`d-flex my-2 ${removed ? "d-none" : "d-flex"}`}>
      <InputGroup className="w-50">
        <label htmlFor="filter-type">
          <InputGroup.Text className="bg-dark text-white">
            Filter
          </InputGroup.Text>
        </label>
        <Form.Control readOnly id="filter-type" value={filterType} />
      </InputGroup>
      <InputGroup className="w-50">
        <label htmlFor="filter-value">
          <InputGroup.Text className="bg-dark text-white">
            Value
          </InputGroup.Text>
        </label>
        <Form.Control readOnly id="filter-value" value={filterValue} />
      </InputGroup>
      <Button variant="danger" onClick={() => handleRemove()}>
        &times;
      </Button>
    </div>
  );
};
export default ActiveFilter;
