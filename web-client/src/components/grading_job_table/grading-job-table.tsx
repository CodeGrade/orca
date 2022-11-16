import React, { createContext, useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { ColumnInfo, GradingJob, SortInfo, SortType } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import "../../stylesheets/grading-job-table.css";
import GradingJobTableHeader from "./grading-job-table-header";
import { DEFAULT_TABLE } from "../../utils/constants";

/**
 * Table context for the grading job header and body
 */
export const TableContext = createContext<{
  tableConfig: ColumnInfo[];
  setTableConfig: React.Dispatch<React.SetStateAction<ColumnInfo[]>>;
  sorting: {
    sortInfo: SortInfo;
    setSortInfo: React.Dispatch<React.SetStateAction<SortInfo>>;
  };
}>({
  tableConfig: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTableConfig: () => {},
  sorting: {
    sortInfo: { type: SortType.RELEASE_AT, asc: true },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setSortInfo: () => {},
  },
});

const GradingJobTable = ({ gradingJobs }: { gradingJobs: GradingJob[] }) => {
  // TODO: Move sorting outside of the table itself so that user can sort by metrics that aren't being displayed on the table
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    type: SortType.RELEASE_AT,
    asc: true,
  });

  // TODO: Move this up to dashboard
  const [tableConfig, setTableConfig] = useState<ColumnInfo[]>(DEFAULT_TABLE);

  // TODO: GET new jobs on sortInfo changing
  useEffect(() => {
    // Get new grading jobs based on sortInfo
  }, [sortInfo]);

  return (
    <Table striped hover className="text-center mb-2">
      <TableContext.Provider
        value={{
          tableConfig,
          setTableConfig,
          sorting: { sortInfo, setSortInfo },
        }}
      >
        <GradingJobTableHeader />
        <GradingJobTableBody gradingJobs={gradingJobs && [...gradingJobs]} />
      </TableContext.Provider>
    </Table>
  );
};
export default GradingJobTable;
