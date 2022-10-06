import React from "react";
import { GradingJob } from "./types";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";

type SortByProps = {
  type: string;
  order: number;
};

type GradingJobTableBodyProps = {
  grading_jobs: GradingJob[];
  sort_by: SortByProps;
};

const GradingJobTableBody = ({
  grading_jobs,
  sort_by,
}: GradingJobTableBodyProps) => {
  const sort_type = sort_by["type"];
  const order = sort_by["order"];

  // TODO: Make helper for this
  switch (sort_type) {
    case "submitter_name":
      grading_jobs.sort((a, b) =>
        a.submitter_name > b.submitter_name ? -order : order
      );
      break;
    case "grader_id":
      grading_jobs.sort((a, b) => (a.grader_id > b.grader_id ? -order : order));
      break;
    case "course_id":
      grading_jobs.sort((a, b) => (a.course_id > b.course_id ? -order : order));
      break;
    case "wait_time":
      grading_jobs.sort((a, b) =>
        a.created_at > b.created_at ? -order : order
      );
      break;
    case "release_time":
      grading_jobs.sort((a, b) =>
        a.release_at > b.release_at ? -order : order
      );
      break;
    default:
      break;
  }

  return (
    <tbody>
      {grading_jobs &&
        grading_jobs.length > 0 &&
        grading_jobs.map((grading_job: GradingJob) => {
          return (
            <GradingJobTableItem
              grading_job={grading_job}
              key={grading_job.nonce}
            />
          );
        })}
    </tbody>
  );
};
export default GradingJobTableBody;
