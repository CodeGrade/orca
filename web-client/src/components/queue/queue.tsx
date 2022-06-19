import React, { useEffect } from "react";
import QueueContent from "./queue-content/queue-content";
import { getGradingJobQueue } from "../../services/grading-job-services";

const Queue = () => {
  useEffect(() => {
    getGradingJobQueue();
  }, []);
  return <QueueContent />;
};
export default Queue;
