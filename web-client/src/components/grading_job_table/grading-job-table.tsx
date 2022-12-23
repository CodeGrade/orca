import React, { useState } from "react";
import Table from "react-bootstrap/Table";
import { GradingJob, SortType } from "./types";
import GradingJobTableBody from "./grading-job-table-body";
import SortableHeaderItem from "./sortable-header-item";
import "../../stylesheets/grading-job-table.css";

const GradingJobTable = ({ gradingJobs }: { gradingJobs: GradingJob[] }) => {
  const [sortBy, setSortBy] = useState({
    type: SortType.RELEASE_AT,
    order: -1,
  });
  const handleSetSortBy = (sortType: SortType) => {
    if (sortType === sortBy.type) {
      setSortBy({ type: sortType, order: sortBy.order * -1 });
    } else {
      setSortBy({ type: sortType, order: -1 });
    }
  };

  return (
    <Table striped hover className="text-center mb-2">
      {/* TODO: Pull out as own component */}
      <thead className="m-auto">
        <tr className="table-dark">
          <th
            scope="col"
            onClick={() => handleSetSortBy(SortType.SUBMITTER_NAME)}
          >
            <SortableHeaderItem
              label={"Submitter(s)"}
              active={sortBy.type === SortType.SUBMITTER_NAME}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy(SortType.GRADER_ID)}>
            <SortableHeaderItem
              label={"Grader"}
              active={sortBy.type === SortType.GRADER_ID}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy(SortType.COURSE_ID)}>
            <SortableHeaderItem
              label={"Course ID"}
              active={sortBy.type === SortType.COURSE_ID}
              order={sortBy.order}
            />
          </th>
          <th scope="col">Submission</th>
          <th scope="col" onClick={() => handleSetSortBy(SortType.WAIT_TIME)}>
            <SortableHeaderItem
              label={"Wait Time"}
              active={sortBy.type === SortType.WAIT_TIME}
              order={sortBy.order}
            />
          </th>
          <th scope="col" onClick={() => handleSetSortBy(SortType.RELEASE_AT)}>
            <SortableHeaderItem
              label={"Release"}
              active={sortBy.type === SortType.RELEASE_AT}
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
    </Table>
  );
};
export default GradingJobTable;
