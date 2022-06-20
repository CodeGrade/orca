import React from "react";
import { GradingJobProps } from "../../reducers/grading-job-reducer";
import QueueItem from "./queue-item";

const QueueContent = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  return (
    <ul className="list-group list-group-horizontal">
      {grading_job_queue &&
        grading_job_queue.map((job) => {
          return (
            <QueueItem
              job_id={job.id}
              queue_pos={job.priority}
              submission_id={job.submission_id}
              grade_id={job.grade_id}
              wait_time={"HH:MM:SS"}
              user_id={job.user_id ? job.user_id : undefined}
              team_id={job.team_id ? job.team_id : undefined}
            />
          );
        })}
    </ul>
  );
};
export default QueueContent;
