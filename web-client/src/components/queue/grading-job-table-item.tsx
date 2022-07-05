import React from "react";
import {
  formatReleaseTimestamp,
  convertHHMMSS,
  describeTime,
  makeReadableDate,
} from "../../helpers/time";
import { getTimeInQueue, getTimeUntilRelease } from "../../helpers/queue-stats";
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
  let id_str: string = "N/A";
  if (user_id) id_str = `U-${user_id}`;
  if (team_id) id_str = `T-${team_id}`;
  // const wait_time: DateTime = DateTime.fromMillis(getTimeInQueue(created_at));
  const time_until_release: DateTime = DateTime.fromMillis(
    getTimeUntilRelease(release_time)
  );
  const x = getTimeUntilRelease(release_time);
  console.log(x);
  console.log(time_until_release);
  const y = DateTime.fromSeconds(release_time);

  // use makeReadableDate for release time tooltip

  return (
    <tr>
      <td>{id_str}</td>
      <td>LINK</td>
      <td>{describeTime(time_until_release)}</td>
      <td>{convertHHMMSS(x)}</td>
      {/* <td>{describeTime(time_until_release)}</td> */}
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
