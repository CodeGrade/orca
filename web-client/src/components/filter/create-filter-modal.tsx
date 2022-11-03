import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { FilterInfo } from "../grading_job_table/types";
import { ActiveFilterContext } from "../dashboard/dashboard";
import FilterBuilder from "./filter-builder";

type CreateFilterModalProps = {
  filterInfo: FilterInfo;
  show: boolean;
  onHide: () => void;
};

/**
 * Context for CreateFilterModal.
 * Contains a FilterInfo object of the filter being built
 * along with the a setter function.
 */
export const CreateFilterContext = createContext<{
  newFilters: FilterInfo;
  setNewFilters: React.Dispatch<React.SetStateAction<FilterInfo>>;
}>({
  newFilters: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setNewFilters: () => {},
});

/**
 * Modal for configuring active filters.
 */
const CreateFilterModal = ({
  filterInfo,
  show,
  onHide,
}: CreateFilterModalProps) => {
  // Existing active filters
  const { activeFilters, setActiveFilters } = useContext(ActiveFilterContext);

  // Filters being configured
  const [newFilters, setNewFilters] = useState<FilterInfo>({
    ...activeFilters,
  });

  const handleClose = () => {
    onHide();
  };

  const handleCancel = () => {
    setActiveFilters(activeFilters);
    setNewFilters(activeFilters);
    handleClose();
  };

  const handleSaveFilter = (): void => {
    setActiveFilters(newFilters);
    handleClose();
  };

  useEffect(() => {
    // Keep newFilters up to date with activeFilters for configuring existing filters
    setNewFilters(activeFilters);
  }, [activeFilters]);

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      backdrop="static"
      keyboard={false}
      centered
      size="lg"
    >
      <Modal.Header>
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
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          variant="outline-success"
          className="rounded"
          onClick={handleSaveFilter}
        >
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default CreateFilterModal;
