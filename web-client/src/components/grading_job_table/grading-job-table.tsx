import React, { useState } from "react";
import { GradingJob } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import SortableHeaderItem from "./sortable-header-item";
import "../../stylesheets/grading-job-table.css";

const GradingJobTable = ({ grading_jobs }: { grading_jobs: GradingJob[] }) => {
  const [sortBy, setSortBy] = useState({ type: "release_time", order: -1 });
  const handleSetSortBy = (sort_type: string) => {
    if (sort_type === sortBy["type"]) {
      setSortBy({ type: sort_type, order: sortBy["order"] * -1 });
    } else {
      setSortBy({ type: sort_type, order: -1 });
    }
  };

  return (
    <table className="table table-hover text-center mb-2">
      <thead className="m-auto">
        <tr className="table-dark">
          <th scope="col" onClick={() => handleSetSortBy("submitter_name")}>
            <SortableHeaderItem
              label={"Submitter(s)"}
              active={sortBy["type"] === "submitter_name"}
              order={sortBy["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("grader_id")}>
            <SortableHeaderItem
              label={"Grader"}
              active={sortBy["type"] === "grader_id"}
              order={sortBy["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("course_id")}>
            <SortableHeaderItem
              label={"Course ID"}
              active={sortBy["type"] === "course_id"}
              order={sortBy["order"]}
            />
          </th>
          <th scope="col">Submission</th>
          <th scope="col" onClick={() => handleSetSortBy("wait_time")}>
            <SortableHeaderItem
              label={"Wait Time"}
              active={sortBy["type"] === "wait_time"}
              order={sortBy["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("release_time")}>
            <SortableHeaderItem
              label={"Release"}
              active={sortBy["type"] === "release_time"}
              order={sortBy["order"]}
            />
          </th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <GradingJobTableBody
        sort_by={sortBy}
        grading_jobs={grading_jobs && [...grading_jobs]}
      />
    </table>
  );
};
export default GradingJobTable;
