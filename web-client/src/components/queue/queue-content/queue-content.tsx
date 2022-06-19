import React from "react";
import QueueItem from "./queue-item";

type GradingJobConfigProps = {
  grade_id: number;
  max_retries: number;
  priority: number;
  script: string[];
  starter_code?: string;
  professor_code?: string;
  student_code: string;
  submission_id: number;
  team_id?: number;
  user_id?: number;
};

type GradingJobProps = {
  config: GradingJobConfigProps;
  created_at: string;
  grade_id: number;
  id: number;
  priority: number;
  submission_id: number;
  team_id?: number;
  user_id?: number;
  updated_at: string;
};

const QueueContent = ({ queue }: { queue: GradingJobProps[] }) => {
  return (
    <ul className="list-group list-group-horizontal">
      {queue &&
        queue.map((q) => {
          return (
            <QueueItem
              job_id={q.id}
              queue_pos={q.priority}
              submission_id={q.submission_id}
              grade_id={q.grade_id}
              wait_time={"HH:MM:SS"}
              user_id={q.user_id ? q.user_id : undefined}
              team_id={q.team_id ? q.team_id : undefined}
            />
          );
        })}
    </ul>
  );
};
export default QueueContent;
