import React from "react";
import { describeTime, makeReadableDate } from "../../utils/time";
import GradingJobActions from "./grading-job-actions";
import { DateTime } from "luxon";
import { GradingJob } from "./types";
import GradingJobSubmitter from "./grading-job-submitter";

const GradingJobTableItem = ({ grading_job }: { grading_job: GradingJob }) => {
  const user_names: string[] = grading_job.user_names
    ? [grading_job.submitter_name, ...grading_job.user_names]
    : [grading_job.submitter_name];

  const now: number = new Date().getTime();
  const release_at = grading_job.release_at;
  const release_at_dt: DateTime = DateTime.fromMillis(release_at);
  const wait_time_dt: DateTime = DateTime.fromMillis(grading_job.created_at);
  const released: boolean = release_at < now;
  return (
    <tr className={`text-wrap ${released ? "table-success" : "table-primary"}`}>
      <td>
        <GradingJobSubmitter user_names={user_names} />
      </td>
      <td>{grading_job.grader_id}</td>
      <td>{grading_job.course_id}</td>
      <td>
        <a href={grading_job.student_code}>View</a>
      </td>
      {/* Remove 'ago' from described time*/}
      <td>{describeTime(wait_time_dt).slice(0, -4)}</td>
      <td
        data-toggle="tooltip"
        title={`${makeReadableDate(release_at_dt, true, true)}`}
      >
        {describeTime(release_at_dt)}
      </td>
      <td>
        <GradingJobActions
          submission_id={grading_job.submission_id}
          nonce={grading_job.nonce}
          user_id={grading_job.user_id ? grading_job.user_id : undefined}
          team_id={grading_job.team_id ? grading_job.team_id : undefined}
          released={released}
        />
      </td>
    </tr>
  );
};
export default GradingJobTableItem;
