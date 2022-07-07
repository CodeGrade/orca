import React from "react";
import { secondsToDhms } from "../../../helpers/time";
import { StatsProps } from "../../../helpers/grading-job-stats";

const ReleasedStats = ({ stats }: { stats: StatsProps }) => {
  return (
    <ul
      className="list-group list-group-horizontal text-center"
      data-toggle="tooltip"
      title="Time Since Release"
    >
      <li className="list-group-item list-group-item-primary">
        <div className="border-bottom border-primary">Released Jobs</div>
        <div>{stats.num}</div>
      </li>
      <li className="list-group-item list-group-item-success">
        <div className="border-bottom border-success">Min</div>
        <div>{stats.num > 0 && secondsToDhms(stats.min)}</div>
      </li>
      <li className="list-group-item list-group-item-info">
        <div className="border-bottom border-info">Avg</div>
        <div>{stats.num > 0 && secondsToDhms(stats.avg)}</div>
      </li>
      <li className="list-group-item list-group-item-danger">
        <div className="border-bottom border-danger">Max</div>
        <div>{stats.num > 0 && secondsToDhms(stats.max)}</div>
      </li>
    </ul>
  );
};
export default ReleasedStats;
