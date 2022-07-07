import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import { State } from "../reducers/grading-job-reducer";
import GradingJobTableItem from "./grading-job-table-item";

const GradingJobTable = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  const true_grading_job_queue = useSelector(
    (state: State) => state.grading_job_queue
  );

  const [trigger_sort, setTriggerSort] = useState(false);
  const [sort_type, setSortType] = useState("release_time");
  const [order, setOrder] = useState(1);

  const setSortParameters = (type: string) => {
    console.log(type, sort_type, order);
    // Used to trigger rerender when sorting by same type but reversing order
    if (sort_type === type) {
      setOrder(-order);
    } else {
      setOrder(1);
      setSortType(type);
    }
    setTriggerSort(!trigger_sort);
  };

  const sortBy = (type: string, order: number) => {
    switch (type) {
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
  };
  useEffect(() => {
    sortBy(sort_type, order);
  }, [trigger_sort]);

  return (
    <table className="table table-hover text-center">
      <thead>
        <tr className="table-primary">
          <th scope="col" onClick={() => setSortParameters("submitter_id")}>
            Submitter ID
          </th>
          <th scope="col" onClick={() => setSortParameters("grade_id")}>
            Grade ID
          </th>
          <th scope="col">Submission</th>
          <th scope="col" onClick={() => setSortParameters("wait_time")}>
            Wait Time
          </th>
          <th scope="col" onClick={() => setSortParameters("release_time")}>
            Release
          </th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
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
    </table>
  );
};
export default GradingJobTable;
