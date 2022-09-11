import React from "react";
import { useSelector } from "react-redux";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import { State } from "../reducers/grading-job-reducer";
import GradingJobTableItem from "./grading-job-table-item";
import "../../stylesheets/grading-job-table.css";

type SortByProps = {
  type: string;
  order: number;
};

interface GradingJobTableBodyProps {
  grading_job_queue: GradingJobProps[];
  sort_by: SortByProps;
}

const GradingJobTableBody = ({
  grading_job_queue,
  sort_by,
}: GradingJobTableBodyProps) => {
  // Grading job queue in original order (unaffected by user sort)
  const true_grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );

  const sort_type = sort_by["type"];
  const order = sort_by["order"];

  switch (sort_type) {
    case "submitter_id":
      // TODO: Replace this with student name when we add it
      break;
    case "grade_id":
      grading_job_queue.sort((a, b) =>
        a.grade_id > b.grade_id ? -order : order
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
        grading_job_queue.map((grading_job) => {
          const true_position = true_grading_job_queue.indexOf(grading_job);
          return (
            <GradingJobTableItem
              sub_id={grading_job.submission_id}
              grade_id={grading_job.grade_id}
              user_id={grading_job.user_id ? grading_job.user_id : undefined}
              team_id={grading_job.team_id ? grading_job.team_id : undefined}
              created_at={grading_job.created_at}
              release_time={grading_job.priority}
              last={true_position + 1 === grading_job_queue.length}
              key={grading_job.submission_id}
            />
          );
        })}
    </tbody>
  );
};
export default GradingJobTableBody;
