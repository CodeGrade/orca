import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import { FilterInfo, FilterSettings } from "../grading_job_table/types";
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
  const { activeFilters, setActiveFilters, activeSettings, setActiveSettings } =
    useContext(ActiveFilterContext);

  // Filters being configured
  const [newFilters, setNewFilters] = useState<FilterInfo>({
    ...activeFilters,
  });

  // Filter settings
  const [newSettings, setNewSettings] = useState<FilterSettings>({
    ...activeSettings,
  });

  const handleClose = () => {
    onHide();
  };

  const handleCancel = () => {
    setActiveFilters(activeFilters);
    setActiveSettings(activeSettings);
    setNewFilters(activeFilters);
    setNewSettings(activeSettings);
    handleClose();
  };

  const handleSaveFilter = (): void => {
    setActiveFilters(newFilters);
    setActiveSettings(newSettings);
    handleClose();
  };

  useEffect(() => {
    // Keep new filters up to date with active filters for configuring existing filters
    setNewFilters(activeFilters);
    setNewSettings(activeSettings);
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
        <div className="d-flex justify-content-between align-items-center gap-3">
          <InputGroup>
            <label
              htmlFor="and-switch"
              className="border border-info clickable"
            >
              <InputGroup.Text>
                {newSettings.and ? "AND" : "OR"}
              </InputGroup.Text>
            </label>
            <Form.Check
              type="switch"
              id="and-switch"
              checked={newSettings.and}
              hidden
              className="d-none"
              onChange={() =>
                setNewSettings({ ...newSettings, and: !newSettings.and })
              }
            />
          </InputGroup>
          <Button
            variant="outline-success"
            className="rounded"
            onClick={handleSaveFilter}
          >
            Done
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
export default CreateFilterModal;
