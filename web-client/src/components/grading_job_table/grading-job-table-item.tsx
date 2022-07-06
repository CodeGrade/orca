import React from "react";
import { describeTime, makeReadableDate } from "../../helpers/time";
import GradingJobActions from "./grading-job-actions";
import { DateTime } from "luxon";

type GradingJobTableItemProps = {
  sub_id: number;
  user_id?: number;
  team_id?: number;
  created_at: number;
  release_time: number;
  position: number;
  total: number;
};

const GradingJobTableItem = ({
  sub_id,
  user_id,
  team_id,
  created_at,
  release_time,
  position,
  total,
}: GradingJobTableItemProps) => {
  let id_str: string = "";
  if (user_id) id_str = `U-${user_id}`;
  else if (team_id) id_str = `T-${team_id}`;
  else id_str = `S-${sub_id}`;

  const release_time_dt: DateTime = DateTime.fromSeconds(release_time);
  const wait_time_dt: DateTime = DateTime.fromSeconds(created_at);

  return (
    <tr>
      <td>{id_str}</td>
      <td>LINK</td>
      <td>{describeTime(wait_time_dt)}</td>
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
          last={position === total}
        />
      </td>
    </tr>
  );
};
export default GradingJobTableItem;
