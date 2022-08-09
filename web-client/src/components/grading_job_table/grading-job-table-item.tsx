import React from "react";
import { describeTime, makeReadableDate } from "../../helpers/time";
import GradingJobActions from "./grading-job-actions";
import { DateTime } from "luxon";

type GradingJobTableItemProps = {
  sub_id: number;
  grade_id: number;
  user_id?: number;
  team_id?: number;
  created_at: number;
  release_time: number;
  last: boolean;
};

const GradingJobTableItem = ({
  sub_id,
  grade_id,
  user_id,
  team_id,
  created_at,
  release_time,
  last,
}: GradingJobTableItemProps) => {
  let id_str: string = "";
  if (user_id) id_str = `U-${user_id}`;
  else if (team_id) id_str = `T-${team_id}`;
  else id_str = `S-${sub_id}`;

  const release_time_dt: DateTime = DateTime.fromMillis(release_time);
  const wait_time_dt: DateTime = DateTime.fromMillis(created_at);
  const now: number = new Date().getTime();
  const released: boolean = release_time < now;

  return (
    <tr className={`${released ? "table-info" : "table-dark"}`}>
      <td>{id_str}</td>
      <td>{grade_id}</td>
      <td>LINK</td>
      {/* Remove 'ago' from described time*/}
      <td>{describeTime(wait_time_dt).slice(0, -4)}</td>
      <td
        data-toggle="tooltip"
        title={`${makeReadableDate(release_time_dt, true, true)}`}
      >
        {describeTime(release_time_dt)}
      </td>
      <td>
        <GradingJobActions
          sub_id={sub_id}
          user_id={user_id ? user_id : undefined}
          team_id={team_id ? team_id : undefined}
          last={last}
          released={released}
        />
      </td>
    </tr>
  );
};
export default GradingJobTableItem;
