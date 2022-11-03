import React, { createContext, useContext, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { FilterInfo } from "../grading_job_table/types";
import ActiveFilter from "./active-filter";
import AddFilter from "./add-filter";
import { FilterContext } from "./filter-bar";

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

const FilterBuilder = ({ filterInfo }: { filterInfo: FilterInfo }) => {
  const [elemId, setElemId] = useState<number>(0);
  const [indexList, setIndexList] = useState<number[]>([]);
  const [elemList, setElemList] = useState<JSX.Element[]>([]);

  const createAddFilterComponent = () => {
    const id = elemId;

    const addFilterElem = (
      <AddFilter key={id} id={id} filterInfo={filterInfo} />
    );
    const updatedFilterList = [...elemList];
    updatedFilterList.push(addFilterElem);
    setElemList(updatedFilterList);
    setElemId(id + 1);
    setIndexList([...indexList, id]);
  };

  const { activeFilters } = useContext(FilterContext);

  return (
    <FilterBuilderContext.Provider
      value={{
        elemList,
        indexList,
        setElemList,
        setIndexList,
      }}
    >
      <div>
        {Object.entries(activeFilters).map(
          ([filterType, filterValues], typeInd) => {
            return [
              ...filterValues.map((filterValue, valueInd) => {
                return (
                  <ActiveFilter
                    filterType={filterType}
                    filterValue={filterValue}
                    id={typeInd}
                    key={`${typeInd}${valueInd}`}
                  />
                );
              }),
            ];
          }
        )}
      </div>
      <div className="mb-3">{elemList}</div>
      <Button variant="success" onClick={() => createAddFilterComponent()}>
        +
      </Button>
    </FilterBuilderContext.Provider>
  );
};
export default FilterBuilder;
