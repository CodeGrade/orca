import React from "react";
import { useSelector } from "react-redux";
import { GradingJob } from "../reducers/grading-job-reducer";
import { State } from "../reducers/grading-job-reducer";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";

type SortByProps = {
  type: string;
  order: number;
};

interface GradingJobTableBody {
  grading_job_queue: GradingJob[];
  sort_by: SortByProps;
}

const GradingJobTableBody = ({
  grading_job_queue,
  sort_by,
}: GradingJobTableBody) => {
  // Grading job queue in original order (unaffected by user sort)
  const true_grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );

  const sort_type = sort_by["type"];
  const order = sort_by["order"];

  // TODO: Make helper for this
  switch (sort_type) {
    case "submitter_name":
      grading_job_queue.sort((a, b) =>
        a.submitter_name > b.submitter_name ? -order : order
      );
      break;
    case "grader_id":
      grading_job_queue.sort((a, b) =>
        a.grader_id > b.grader_id ? -order : order
      );
      break;
    case "course_id":
      grading_job_queue.sort((a, b) =>
        a.course_id > b.course_id ? -order : order
      );
      break;
    case "wait_time":
      grading_job_queue.sort((a, b) =>
        a.created_at > b.created_at ? -order : order
      );
      break;
    case "release_time":
      grading_job_queue.sort((a, b) =>
        a.priority > b.priority ? -order : order
      );
      break;
    default:
      break;
  }

  return (
    <tbody>
      {grading_job_queue &&
        grading_job_queue.length > 0 &&
        grading_job_queue.map((grading_job: GradingJob) => {
          const true_position = true_grading_job_queue.indexOf(grading_job);
          return (
            <GradingJobTableItem
              grading_job={grading_job}
              last={true_position + 1 === grading_job_queue.length}
              key={grading_job.submission_id}
            />
          );
        })}
    </tbody>
  );
};
export default GradingJobTableBody;
