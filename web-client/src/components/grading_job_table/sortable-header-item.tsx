import React, { useContext, useEffect, useState } from "react";
import { TableContext } from "./grading-job-table";
import { SortType } from "./types";

type SortableHeaderItemProps = {
  label: string;
  sortType: SortType;
};

const SortableHeaderItem = ({ label, sortType }: SortableHeaderItemProps) => {
  const { sorting } = useContext(TableContext);
  const { sortInfo, setSortInfo } = sorting;

  const [sortingBy, setSortingBy] = useState(sortInfo.type === sortType);
  const [asc, setAsc] = useState(sortInfo.asc);

  const handleSetSortBy = (sortType: SortType) => {
    const asc = sortType === sortInfo.type ? !sortInfo.asc : true;
    setSortInfo({ type: sortType, asc });
  };

  useEffect(() => {
    setSortingBy(sortInfo.type === sortType);
    setAsc(sortInfo.asc);
  }, [sortInfo]);

  return (
    <th scope="col" onClick={() => handleSetSortBy(sortType)}>
      <span>{label}</span>
      <span className={`ms-1 ${sortingBy ? "d-inline" : "d-none"}`}>
        <span>{asc ? "v" : "^"}</span>
      </span>
    </th>
  );
};
export default SortableHeaderItem;
