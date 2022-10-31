import React from "react";
import { GradingJob, SortType } from "./types";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";

type GradingJobTableBodyProps = {
  gradingJobs: GradingJob[];
  sortBy: {
    type: SortType;
    order: number;
  };
};

const GradingJobTableBody = ({
  gradingJobs,
  sortBy,
}: GradingJobTableBodyProps) => {
  const { type: sortType, order } = sortBy;

  const sortGradingJobs = (
    gradingJobs: GradingJob[],
    sortType: SortType,
    order: number
  ): GradingJob[] => {
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
  const sortedGradingJobs = sortGradingJobs(gradingJobs, sortType, order);

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
