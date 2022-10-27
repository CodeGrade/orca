import React from "react";
import { GradingJob } from "./types";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";

type GradingJobTableBodyProps = {
  gradingJobs: GradingJob[];
  sortBy: {
    type: string;
    order: number;
  };
};

const GradingJobTableBody = ({
  gradingJobs,
  sortBy,
}: GradingJobTableBodyProps) => {
  const { type: sortType, order } = sortBy;

  // TODO: Dynamically access property to sort by
  switch (sortType) {
    case "submitter_name":
      gradingJobs.sort((a, b) =>
        a.submitter_name > b.submitter_name ? -order : order
      );
      break;
    case "grader_id":
      gradingJobs.sort((a, b) => (a.grader_id > b.grader_id ? -order : order));
      break;
    case "course_id":
      gradingJobs.sort((a, b) => (a.course_id > b.course_id ? -order : order));
      break;
    case "wait_time":
      gradingJobs.sort((a, b) =>
        a.created_at > b.created_at ? -order : order
      );
      break;
    case "release_time":
      gradingJobs.sort((a, b) =>
        a.release_at > b.release_at ? -order : order
      );
      break;
    default:
      break;
  }

  return (
    <tbody>
      {gradingJobs &&
        gradingJobs.length > 0 &&
        gradingJobs.map((gradingJob: GradingJob) => {
          return (
            <GradingJobTableItem gradingJob={gradingJob} key={gradingJob.key} />
          );
        })}
    </tbody>
  );
};
export default GradingJobTableBody;
