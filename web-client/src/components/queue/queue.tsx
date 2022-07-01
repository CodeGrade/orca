import React, { useEffect } from "react";
import QueueContent from "./queue-content/queue-content";
import { getGradingJobQueue } from "../../actions/grading-job-actions";
import { Dispatch } from "redux";
import { useDispatch, useSelector } from "react-redux";
import { State } from "../reducers/grading-job-reducer";

const Queue = () => {
  const grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    getGradingJobQueue(dispatch);
  }, []);
  return (
    <div className="d-flex justify-content-center align-items-center mt-3">
      <QueueContent grading_job_queue={grading_job_queue} />
    </div>
  );
};
export default Queue;
