import React, { useState } from "react";
import { GradingJob } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import SortableHeaderItem from "./sortable-header-item";
import "../../stylesheets/grading-job-table.css";

const GradingJobTable = ({ gradingJobs }: { gradingJobs: GradingJob[] }) => {
  const [sortBy, setSortBy] = useState({ type: "release_time", order: -1 });
  const handleSetSortBy = (sortType: string) => {
    if (sortType === sortBy.type) {
      setSortBy({ type: sortType, order: sortBy.order * -1 });
    } else {
      setSortBy({ type: sortType, order: -1 });
    }
  };

  return (
    <table className="table table-hover text-center mb-2">
      {/* TODO: Pull out as own component */}
      <thead className="m-auto">
        <tr className="table-dark">
          <th scope="col" onClick={() => handleSetSortBy("submitter_name")}>
            <SortableHeaderItem
              label={"Submitter(s)"}
              active={sortBy.type === "submitter_name"}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("grader_id")}>
            <SortableHeaderItem
              label={"Grader"}
              active={sortBy.type === "grader_id"}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("course_id")}>
            <SortableHeaderItem
              label={"Course ID"}
              active={sortBy.type === "course_id"}
              order={sortBy.order}
            />
          </th>
          <th scope="col">Submission</th>
          <th scope="col" onClick={() => handleSetSortBy("wait_time")}>
            <SortableHeaderItem
              label={"Wait Time"}
              active={sortBy.type === "wait_time"}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("release_time")}>
            <SortableHeaderItem
              label={"Release"}
              active={sortBy.type === "release_time"}
              order={sortBy.order}
            />
          </th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <GradingJobTableBody
        sortBy={sortBy}
        gradingJobs={gradingJobs && [...gradingJobs]}
      />
    </table>
  );
};
export default GradingJobTable;
