import React, { createContext, useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
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
import { FilterContext } from "./filter-bar";
import FilterBuilder from "./filter-builder";

type CreateFilterModalProps = {
  filterInfo: FilterInfo;
  show: boolean;
  onHide: () => void;
};

export const CreateFilterContext = createContext<{
  newFilters: FilterInfo;
  setNewFilters: React.Dispatch<React.SetStateAction<FilterInfo>>;
}>({
  newFilters: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setNewFilters: () => {},
});

const CreateFilterModal = ({
  filterInfo,
  show,
  onHide,
}: CreateFilterModalProps) => {
  const { activeFilters, setActiveFilters } = useContext(FilterContext);

  const [newFilters, setNewFilters] = useState<FilterInfo>({
    ...activeFilters,
  });

  const handleClose = () => {
    onHide();
  };

  const handleCreateFilter = (): void => {
    setActiveFilters(newFilters);
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
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Create Filter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateFilterContext.Provider
          value={{
            newFilters,
            setNewFilters,
          }}
        >
          <FilterBuilder filterInfo={filterInfo}></FilterBuilder>
        </CreateFilterContext.Provider>
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
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default CreateFilterModal;
