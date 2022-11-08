import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { FilterInfo } from "../grading_job_table/types";
import ActiveFilter from "./active-filter";
import NewFilter from "./new-filter";
import { ActiveFilterContext } from "../dashboard/dashboard";
import { CreateFilterContext } from "./create-filter-modal";

/**
 * Context for FilterBuilder.
 * Provides information and functions to allow NewFilter components
 * to remove themselves from the parent FilterBuilder component.
 */
export const FilterBuilderContext = createContext<{
  elemList: JSX.Element[];
  indexList: number[];
  setElemList: React.Dispatch<React.SetStateAction<JSX.Element[]>>;
  setIndexList: React.Dispatch<React.SetStateAction<number[]>>;
}>({
  elemList: [],
  indexList: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setElemList: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIndexList: () => {},
});

/**
 * Contains main functionality of the filter creating modal.
 * Displays active filters with the ability to remove them.
 * Displays the filters currently being configured and provides
 * functioality to add/remove them.
 */
const FilterBuilder = ({ filterInfo }: { filterInfo: FilterInfo }) => {
  const { activeFilters } = useContext(ActiveFilterContext);
  // Filters being configured
  const { newFilters, setNewFilters } = useContext(CreateFilterContext);

  // Used to add/remove NewFilter components on button clicks
  const [elemId, setElemId] = useState<number>(0);
  const [indexList, setIndexList] = useState<number[]>([]);
  const [elemList, setElemList] = useState<JSX.Element[]>([]);
  const [activeElemList, setActiveElemList] = useState<JSX.Element[]>([]);
  // Used to reload the page when the clear all button is pressed
  const [reload, setReload] = useState<boolean>(false);

  /**
   * Creates a NewFilter component to be rendered.
   */
  const createNewFilterComponent = () => {
    const id = elemId;
    const newFilterElem = (
      <NewFilter key={id} id={id} filterInfo={filterInfo} />
    );
    const updatedFilterList = [...elemList];
    updatedFilterList.push(newFilterElem);
    setElemList(updatedFilterList);
    setElemId(id + 1);
    setIndexList([...indexList, id]);
  };

  const handleClearAll = () => {
    setNewFilters({});
    setElemId(0);
    setIndexList([]);
    setElemList([]);
    setActiveElemList([]);
    setReload(!reload);
  };

  const renderClearAllButton = (): boolean => {
    return Object.keys(newFilters).length !== 0;
  };

  /**
   * Create elements for currently active filters on load.
   */
  useEffect(() => {
    const activeFilterElems = Object.entries(activeFilters)
      .map(([filterType, filterValues], typeInd) => {
        return filterValues.map((filterValue, valueInd) => {
          return (
            <ActiveFilter
              filterType={filterType}
              filterValue={filterValue}
              key={`${typeInd}${valueInd}`}
            />
          );
        });
      })
      .flat(1);
    setActiveElemList(activeFilterElems);
  }, []);

  /**
   * Render default state on reload.
   */
  useEffect(() => {
    createNewFilterComponent();
  }, [reload]);

  return (
    <FilterBuilderContext.Provider
      value={{
        elemList,
        indexList,
        setElemList,
        setIndexList,
      }}
    >
      <div className={`${activeElemList.length !== 0 ? "d-block" : "d-none"}`}>
        {/* Render already active filters */}
        <h5>Active Filters</h5>
        {activeElemList}
        <hr />
      </div>
      {/* Render new filters being configured */}
      <h5>New Filters</h5>
      <div className="mb-3">{elemList}</div>
      <div className="d-flex justify-content-between">
        <Button variant="success" onClick={() => createNewFilterComponent()}>
          +
        </Button>
        <div>
          <Button
            variant="danger"
            onClick={() => handleClearAll()}
            className={`${renderClearAllButton() ? "d-flex" : "d-none"}`}
          >
            Clear All
          </Button>
        </div>
      </div>
    </FilterBuilderContext.Provider>
  );
};
export default FilterBuilder;
