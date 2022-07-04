import React from "react";
import { GradingJobProps } from "../../reducers/grading-job-reducer";
import QueueItem from "./queue-item";

const QueueContent = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  return (
    <div>
      <ul className="list-group list-group-horizontal">
        {grading_job_queue && grading_job_queue.length > 0 ? (
          grading_job_queue.map((job, index) => {
            return (
              <QueueItem
                queue_pos={index + 1}
                release={job.priority}
                submission_id={job.submission_id}
                grade_id={job.grade_id}
                created_at={job.created_at}
                user_id={job.user_id ? job.user_id : undefined}
                team_id={job.team_id ? job.team_id : undefined}
                total={grading_job_queue.length}
                key={job.submission_id}
              />
            );
          })
        ) : (
          <h3>There are no jobs in the queue</h3>
        )}
      </ul>
    </div>
  );
};
export default QueueContent;
