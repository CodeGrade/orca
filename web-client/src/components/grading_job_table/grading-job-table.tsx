import React, { useState } from "react";
import { GradingJob } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import SortableHeaderItem from "./sortable-header-item";
import "../../stylesheets/grading-job-table.css";

const GradingJobTable = ({ grading_jobs }: { grading_jobs: GradingJob[] }) => {
  const [sort_by, setSortBy] = useState({ type: "release_time", order: -1 });
  const handleSetSortBy = (sort_type: string) => {
    if (sort_type === sort_by["type"]) {
      setSortBy({ type: sort_type, order: sort_by["order"] * -1 });
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
              active={sort_by["type"] === "submitter_name"}
              order={sort_by["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("grader_id")}>
            <SortableHeaderItem
              label={"Grader"}
              active={sort_by["type"] === "grader_id"}
              order={sort_by["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("course_id")}>
            <SortableHeaderItem
              label={"Course ID"}
              active={sort_by["type"] === "course_id"}
              order={sort_by["order"]}
            />
          </th>
          <th scope="col">Submission</th>
          <th scope="col" onClick={() => handleSetSortBy("wait_time")}>
            <SortableHeaderItem
              label={"Wait Time"}
              active={sort_by["type"] === "wait_time"}
              order={sort_by["order"]}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy("release_time")}>
            <SortableHeaderItem
              label={"Release"}
              active={sort_by["type"] === "release_time"}
              order={sort_by["order"]}
            />
          </th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <GradingJobTableBody
        sort_by={sort_by}
        grading_jobs={grading_jobs && [...grading_jobs]}
      />
    </table>
  );
};
export default GradingJobTable;
