import React, { useContext, useState } from "react";
import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import {
  createDefaultFilterOptionElem,
  createOptionElemsFromArr,
  getFilterValueOptionElems,
} from "../../utils/filter";
import { FilterInfo } from "../grading_job_table/types";
import { CreateFilterContext } from "./create-filter-modal";
import { FilterBuilderContext } from "./filter-builder";

type NewFilterProps = {
  filterInfo: FilterInfo;
  id: number;
};

/**
 * Form component for configuring new filters.
 * Filter types and values are generated according to the provided filterInfo.
 * Can be confirmed or removed.  Confirmed filters will be
 * applied when filter creation modal is closed (not cancelled).
 */
const NewFilter = ({ filterInfo, id }: NewFilterProps) => {
  // Filters being configured
  const { newFilters, setNewFilters } = useContext(CreateFilterContext);
  // Information needed to be able to remove new filter
  const { elemList, indexList, setElemList, setIndexList } =
    useContext(FilterBuilderContext);
  // Generate the <option> elements for filter types
  const filterTypeOptions = createOptionElemsFromArr(
    Array.from(Object.keys(filterInfo))
  );
  // Holds the <option> elements for filter values of the selected type
  const [filterValueOptions, setFilterValueOptions] = useState<JSX.Element[]>([
    createDefaultFilterOptionElem(),
  ]);

  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);

  /**
   * Handler for selecting filter type when creating a new filter.
   * Generates the corresponding filter values for the selected type.
   * @param filterType - The selected filter type
   */
  const handleSetFilterType = (filterType: string): void => {
    if (filterType)
      setFilterValueOptions(
        getFilterValueOptionElems(filterType, filterInfo[filterType])
      );
    setFilterValue("");
    setFilterType(filterType);
  };

  /**
   * Checks if a given filters object contains a given filter (type and value).
   * @param filters - FilterInfo object to check for existing filter
   * @param filterType - The filter type to check values of
   * @param filterValue - The value to check
   * @returns true if filter exists, false otherwise
   */
  const filterAlreadyExists = (
    filters: FilterInfo,
    filterType: string,
    filterValue: string
  ): boolean => {
    return filterType in filters && filters[filterType].includes(filterValue);
  };

  /**
   * Returns if the remove button should be rendered.
   * @returns true if render, false otherwise
   */
  const renderRemoveButton = (): boolean => {
    return elemList.length > 1 || confirmed;
  };

  /**
   * Returns if confirm button should be rendered.
   * @returns true if render, false otherwise
   */
  const renderConfirmButton = (): boolean => {
    return (
      filterType !== "" &&
      filterValue != "" &&
      !confirmed &&
      !filterAlreadyExists(newFilters, filterType, filterValue)
    );
  };

  /**
   * Handles removing a new filter being configured.
   */
  const handleRemove = () => {
    // If filter is already confirmed, then remove it from the FilterInfo object
    if (confirmed && filterType && filterValue) {
      const updatedFilters = {
        ...newFilters,
      };
      updatedFilters[filterType] = updatedFilters[filterType].filter(
        (value) => value !== filterValue
      );
      if (updatedFilters[filterType].length === 0)
        delete updatedFilters[filterType];
      setNewFilters(updatedFilters);
    }
    // Remove the element
    const index = indexList.indexOf(id);
    const updatedIndexList = [...indexList];
    const updatedElemList = [...elemList];
    updatedIndexList.splice(index, 1);
    updatedElemList.splice(index, 1);
    setIndexList(updatedIndexList);
    setElemList(updatedElemList);
    setFilterValue("");
    setFilterType("");
  };

  /**
   * Handles confirming a new filter.
   */
  const handleConfirm = () => {
    // TODO: Remove this - confirm button isn't rendered for duplicate filters
    if (filterAlreadyExists(newFilters, filterType, filterValue)) {
      alert("Filter already exists");
      return;
    }
    // Update FilterInfo being built
    const values = newFilters[filterType] ? newFilters[filterType] : [];
    const updatedFilters = {
      ...newFilters,
    };
    updatedFilters[filterType] = [...values, filterValue];
    setNewFilters(updatedFilters);
    setConfirmed(true);
  };

  return (
    <div className={`d-flex my-2 ${confirmed ? "confirmed-filter" : ""}`}>
      <InputGroup className="w-50">
        <label htmlFor="filter-type">
          <InputGroup.Text>Filter</InputGroup.Text>
        </label>
        <Form.Select
          disabled={confirmed}
          id="filter-type"
          value={filterType}
          onChange={(event) => handleSetFilterType(event.target.value)}
        >
          {filterTypeOptions}
        </Form.Select>
      </InputGroup>
      <div className={"w-50 align-items-center d-flex"}>
        <InputGroup className={`${filterType ? "d-flex" : "d-none"}`}>
          <Form.Select
            disabled={confirmed}
            id="filter-value"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
          >
            {filterValueOptions}
          </Form.Select>
        </InputGroup>
        <Button
          variant="success"
          className={`close-btn align-items-center ${
            renderConfirmButton() ? "d-flex" : "d-none"
          }`}
          onClick={() => handleConfirm()}
        >
          ✓
        </Button>
        <Button
          variant="danger"
          className={`${renderRemoveButton() ? "d-flex" : "d-none"}`}
          onClick={() => handleRemove()}
        >
          &times;
        </Button>
      </div>
    </div>
  );
};
export default NewFilter;
