import React from "react";
import { millisToDHHMMSS } from "../../../utils/time";
import { TimeStats } from "../types";

const StatsBar = ({
  label,
  tooltip,
  stats,
}: {
  label: string;
  tooltip: string;
  stats: TimeStats;
}) => {
  return (
    <ul
      className="list-group list-group-horizontal text-center"
      data-toggle="tooltip"
      title={tooltip}
    >
      <li className="list-group-item list-group-item-primary">
        <div className="border-bottom border-primary">{label} Jobs</div>
        <div>{stats.num}</div>
      </li>
      <li className="list-group-item list-group-item-dark">
        <div className="border-bottom border-success">Min</div>
        <div>{stats.num > 0 && millisToDHHMMSS(stats.min)}</div>
      </li>
      <li className="list-group-item list-group-item-dark">
        <div className="border-bottom border-warning">Avg</div>
        <div>{stats.num > 0 && millisToDHHMMSS(stats.avg)}</div>
      </li>
      <li className="list-group-item list-group-item-dark">
        <div className="border-bottom border-danger">Max</div>
        <div>{stats.num > 0 && millisToDHHMMSS(stats.max)}</div>
      </li>
    </ul>
  );
};
export default StatsBar;
