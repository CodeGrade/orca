import React, { useContext } from "react";
import { GradingJob, SortInfo, SortType } from "./types";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";
import { TableContext } from "./grading-job-table";

type GradingJobTableBodyProps = {
  gradingJobs: GradingJob[];
};

const GradingJobTableBody = ({ gradingJobs }: GradingJobTableBodyProps) => {
  const { sorting } = useContext(TableContext);
  const { type: sortType, asc } = sorting.sortInfo;

  // TODO: Remove once sorting is handled by backend
  const sortGradingJobs = (
    gradingJobs: GradingJob[],
    sortType: SortType,
    asc: boolean
  ): GradingJob[] => {
    const order = asc ? -1 : 1;
    // Sort types that are not in metadata_table
    if (sortType === SortType.RELEASE_AT || sortType === SortType.WAIT_TIME) {
      return gradingJobs.sort((a, b) =>
        a[sortType] > b[sortType] ? -order : order
      );
    }
    return gradingJobs.sort((a, b) =>
      a.metadata_table[sortType] > b.metadata_table[sortType] ? -order : order
    );
  };
  const sortedGradingJobs = sortGradingJobs(gradingJobs, sortType, asc);

  return (
    <tbody>
      {sortedGradingJobs &&
        sortedGradingJobs.length > 0 &&
        sortedGradingJobs.map((gradingJob: GradingJob) => {
          return (
            <GradingJobTableItem gradingJob={gradingJob} key={gradingJob.key} />
          );
        })}
    </tbody>
  );
};
export default GradingJobTableBody;
