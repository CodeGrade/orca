import React, { useState } from "react";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import GradingJobTableBody from "./grading-job-table-body";
import SortableHeaderItem from "./sortable-header-item";
import "../../stylesheets/grading-job-table.css";

const GradingJobTable = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  const [sortBy, setSortBy] = useState({ type: "release_time", order: -1 });
  const handleSetSortBy = (sort_type: string) => {
    if (sort_type === sortBy["type"]) {
      setSortBy({ type: sort_type, order: sortBy["order"] * -1 });
    } else {
      setSortBy({ type: sort_type, order: -1 });
    }
  };

  return (
    <table className="table table-hover text-center">
      <thead className="m-auto">
        <tr className="table-primary">
          <th scope="col">Submitter ID</th>
          <th scope="col" onClick={() => handleSetSortBy("grade_id")}>
            <SortableHeaderItem
              label={"Grade ID"}
              active={sortBy["type"] === "grade_id"}
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
        grading_job_queue={grading_job_queue && [...grading_job_queue]}
      />
    </table>
  );
};
export default GradingJobTable;
