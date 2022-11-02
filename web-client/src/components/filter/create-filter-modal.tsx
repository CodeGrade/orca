import React, { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import {
  createDefaultFilterOptionElem,
  createOptionElemsFromArr,
  getFilterValueOptionElems,
} from "../../utils/filter";
import { OffsetContext } from "../dashboard/dashboard";
import { FilterInfo } from "../grading_job_table/types";
import { FilterContext } from "./filter-bar";

type CreateFilterModalProps = {
  filterInfo: FilterInfo;
  show: boolean;
  onHide: () => void;
};

const CreateFilterModal = ({
  filterInfo,
  show,
  onHide,
}: CreateFilterModalProps) => {
  const { activeFilters, setActiveFilters } = useContext(FilterContext);
  const { setOffset } = useContext(OffsetContext);

  // Generate filter type options using provided filterInfo
  const filterTypeOptions = createOptionElemsFromArr(
    Array.from(Object.keys(filterInfo))
  );
  const [filterValueOptions, setFilterValueOptions] = useState<JSX.Element[]>([
    createDefaultFilterOptionElem(),
  ]);

  const [filterType, setFilterType] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const handleSetFilterType = (filterType: string): void => {
    if (filterType)
      setFilterValueOptions(
        getFilterValueOptionElems(filterType, filterInfo[filterType])
      );
    setFilterValue("");
    setFilterType(filterType);
  };

  const handleClose = () => {
    setFilterType("");
    setFilterValue("");
    onHide();
  };

  const filterAlreadyExists = (
    activeFilters: FilterInfo,
    filterType: string,
    filterValue: string
  ): boolean => {
    return (
      filterType in activeFilters &&
      activeFilters[filterType].includes(filterValue)
    );
  };

  const handleCreateFilter = (): void => {
    if (filterAlreadyExists(activeFilters, filterType, filterValue)) {
      // TODO: Alert user with message in modal
      alert("Filter already exists");
      return;
    }
    const values = activeFilters[filterType] ? activeFilters[filterType] : [];
    const updatedActiveFilters = {
      ...activeFilters,
    };
    updatedActiveFilters[filterType] = [...values, filterValue];
    setActiveFilters(updatedActiveFilters);
    setOffset(0);
    handleClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
      centered
      className="primary"
    >
      <Modal.Header closeButton>
        <Modal.Title>Create a Filter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <label htmlFor="filter-by">Filter</label>
          </InputGroup.Text>
          <Form.Select
            id="filter-by"
            value={filterType}
            onChange={(event) => handleSetFilterType(event.target.value)}
          >
            {filterTypeOptions}
          </Form.Select>
        </InputGroup>
        <InputGroup
          className={`form-group ${filterType ? "d-flex" : "d-none"}`}
        >
          <InputGroup.Text>
            <label htmlFor="filter-value">Value</label>
          </InputGroup.Text>
          <Form.Select
            id="filter-value"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
          >
            {filterValueOptions}
          </Form.Select>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button
          variant="outline-danger"
          className="rounded"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="outline-success"
          className="rounded"
          onClick={handleCreateFilter}
        >
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default CreateFilterModal;
