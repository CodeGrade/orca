import React from "react";
import QueueItem from "./queue-item";

const QueueContent = () => {
  return (
    <ul className="list-group list-group-horizontal">
      <QueueItem
        job_id={123}
        queue_pos={1}
        submission_id={234}
        grade_id={345}
        wait_time={"00:00:30"}
        user_id={456}
      />
    </ul>
  );
};
export default QueueContent;
