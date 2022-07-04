import React from "react";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import QueueContent from "./queue-content/queue-content";
import QueueStats from "./queue-stats";

const Queue = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  return (
    <div>
      <QueueStats grading_job_queue={grading_job_queue && grading_job_queue} />
      <div className="d-flex justify-content-center align-items-center mt-3">
        <QueueContent
          grading_job_queue={grading_job_queue && grading_job_queue}
        />
      </div>
    </div>
  );
};
export default Queue;
