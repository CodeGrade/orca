import React from "react";
import { convertHHMMSS } from "../../helpers/time";

export type GraderWaitTimeStats = {
  avg: number;
  min: number;
  max: number;
  num_jobs: number;
};

type GraderStatsItemProps = {
  grade_id: number;
  wait_time_stats: GraderWaitTimeStats;
};

const GraderStatsItem = ({
  grade_id,
  wait_time_stats,
}: GraderStatsItemProps) => {
  return (
    <li className="list-group-item text-center bg-dark">
      <ul className="list-group">
        <li className="list-group-item active">{grade_id}</li>
        <li className="list-group-item">{wait_time_stats.num_jobs}</li>
        <li className="list-group-item">
          {convertHHMMSS(wait_time_stats.avg)}
        </li>
        <li className="list-group-item">
          {convertHHMMSS(wait_time_stats.min)}
        </li>
        <li className="list-group-item">
          {convertHHMMSS(wait_time_stats.max)}
        </li>
      </ul>
    </li>
  );
};
export default GraderStatsItem;
