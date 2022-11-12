import React, { useContext } from "react";
import { TableContext } from "./grading-job-table";
import SortableHeaderItem from "./sortable-header-item";
import { ColumnInfo } from "./types";

const GradingJobTableHeader = () => {
  const { tableConfig } = useContext(TableContext);

  return (
    <thead className="m-auto">
      <tr className="table-dark">
        {/* Generate column headers based on table config context */}
        {tableConfig.map((colInfo: ColumnInfo, ind) => {
          const { label, sortType } = colInfo;
          if (!sortType) return <th key={ind}>{label}</th>;
          return (
            <SortableHeaderItem label={label} sortType={sortType} key={ind} />
          );
        })}
      </tr>
    </thead>
  );
};
export default GradingJobTableHeader;
