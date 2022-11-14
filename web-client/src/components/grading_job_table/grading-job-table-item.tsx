import React from "react";
import { describeTime, makeReadableDate } from "../../utils/time";
import GradingJobActions from "./grading-job-options";
import { DateTime } from "luxon";
import { GradingJob } from "./types";
import GradingJobSubmitter from "./grading-job-submitter";

const GradingJobTableItem = ({ gradingJob }: { gradingJob: GradingJob }) => {
  const { metadata_table: metadata, files } = gradingJob;
  const studentNames: string[] = metadata.user_names
    ? [metadata.submitter_name, ...metadata.user_names]
    : [metadata.submitter_name];

  const now: number = new Date().getTime();
  const { release_at: releaseAt, created_at: createdAt } = gradingJob;
  const releaseAtDT: DateTime = DateTime.fromMillis(releaseAt);
  const waitTimeDT: DateTime = DateTime.fromMillis(createdAt);
  const isReleased: boolean = releaseAt < now;
  return (
    <tr
      className={`text-wrap ${isReleased ? "table-success" : "table-primary"}`}
    >
      <td>
        <GradingJobSubmitter user_names={studentNames} />
      </td>
      <td>{metadata.grader_id}</td>

      <td>{metadata.course_id}</td>
      <td>
        <a href={files.student_code.url}>View</a>
      </td>
      {/* Remove 'ago' from described time*/}
      <td>{describeTime(waitTimeDT).slice(0, -4)}</td>
      <td
        data-toggle="tooltip"
        title={`${makeReadableDate(releaseAtDT, true, true)}`}
      >
        {describeTime(releaseAtDT)}
      </td>
      <td>
        <GradingJobActions
          jobKey={gradingJob.key}
          nonce={gradingJob.nonce}
          collation={gradingJob.collation}
          released={isReleased}
        />
      </td>
    </tr>
  );
};
export default GradingJobTableItem;
