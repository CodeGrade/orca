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
import { FilterContext } from "./filter-bar";
import { FilterBuilderContext } from "./filter-builder";

type AddFilterProps = {
  filterInfo: FilterInfo;
  id: number;
};

const AddFilter = ({ filterInfo, id }: AddFilterProps) => {
  const { newFilters: filters, setNewFilters: setFilters } =
    useContext(CreateFilterContext);
  const { elemList, indexList, setElemList, setIndexList } =
    useContext(FilterBuilderContext);
  const filterTypeOptions = createOptionElemsFromArr(
    Array.from(Object.keys(filterInfo))
  );
  const [filterValueOptions, setFilterValueOptions] = useState<JSX.Element[]>([
    createDefaultFilterOptionElem(),
  ]);

  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const handleSetFilterType = (filterType: string): void => {
    if (filterType)
      setFilterValueOptions(
        getFilterValueOptionElems(filterType, filterInfo[filterType])
      );
    setFilterValue("");
    setFilterType(filterType);
  };

  const filterAlreadyExists = (
    filters: FilterInfo,
    filterType: string,
    filterValue: string
  ): boolean => {
    return filterType in filters && filters[filterType].includes(filterValue);
  };

  const handleSetFilterValue = (filterValue: string) => {
    setFilterValue(filterValue);
  };

  const renderRemoveButton = (): boolean => {
    return elemList.length > 1 || confirmed;
  };
  const renderConfirmButton = (): boolean => {
    return (
      filterType !== "" &&
      filterValue != "" &&
      !confirmed &&
      !filterAlreadyExists(filters, filterType, filterValue)
    );
  };

  const handleRemove = () => {
    if (confirmed && filterType && filterValue) {
      const updatedFilters = {
        ...filters,
      };
      updatedFilters[filterType] = updatedFilters[filterType].filter(
        (value) => value !== filterValue
      );
      if (updatedFilters[filterType].length === 0)
        delete updatedFilters[filterType];
      setFilters(updatedFilters);
    }
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

  const handleConfirm = () => {
    if (filterAlreadyExists(filters, filterType, filterValue)) {
      // TODO: Alert user with message in modal
      alert("Filter already exists");
      return;
    }
    const values = filters[filterType] ? filters[filterType] : [];
    const updatedFilters = {
      ...filters,
    };
    updatedFilters[filterType] = [...values, filterValue];
    setFilters(updatedFilters);
    setConfirmed(true);
  };

  return (
    <div className={`d-flex my-2 ${confirmed ? "confirmed-filter" : ""}`}>
      <InputGroup className="w-50">
        <InputGroup.Text>
          <label htmlFor="filter-by">Filter</label>
        </InputGroup.Text>
        <Form.Select
          disabled={confirmed}
          id="filter-by"
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
            onChange={(event) => handleSetFilterValue(event.target.value)}
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
export default AddFilter;
