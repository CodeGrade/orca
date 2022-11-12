import React, { createContext, useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { ColumnInfo, GradingJob, SortInfo, SortType } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import "../../stylesheets/grading-job-table.css";
import GradingJobTableHeader from "./grading-job-table-header";

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
    setSortInfo: () => {},
  },
});

const GradingJobTable = ({ gradingJobs }: { gradingJobs: GradingJob[] }) => {
  // TODO: Move sorting outside of the table itself so that user can sort by metrics that aren't being displayed on the table
  const [sortInfo, setSortInfo] = useState<SortInfo>({
    type: SortType.RELEASE_AT,
    asc: true,
  });

  const DEFAULT_TABLE = [
    { label: "Submission", prop: "files.student_code.url" },
    {
      label: "Submitter(s)",
      sortType: SortType.SUBMITTER_NAME,
      prop: "metadata_table.submitter_name",
    },
    {
      label: "Grader",
      sortType: SortType.GRADER_ID,
      prop: "metadata_table.grader_id",
    },
    {
      label: "Course",
      sortType: SortType.COURSE_ID,
      prop: "metadata_table.course_id",
    },
    { label: "Wait Time", sortType: SortType.WAIT_TIME, prop: "created_at" },
    { label: "Release", sortType: SortType.RELEASE_AT, prop: "release_at" },
  ];
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
