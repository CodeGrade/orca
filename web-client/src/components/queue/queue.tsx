import React, { useState, useEffect } from "react";
import QueueContent from "./queue-content/queue-content";
import { getGradingJobQueue } from "../../services/grading-job-services";

const Queue = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    getGradingJobQueue().then((response) => setQueue(response));
  }, []);
  return <QueueContent queue={queue} />;
};
export default Queue;
