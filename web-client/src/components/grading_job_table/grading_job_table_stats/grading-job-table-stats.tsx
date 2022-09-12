import React from "react";
import StatsBar from "./stats-bar";
import { GradingQueueStats } from "../types";

const GradingJobTableStats = ({ stats }: { stats: GradingQueueStats }) => {
  return (
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center">
      <div className="me-lg-3">
        <StatsBar label="Total" tooltip="Wait Times" stats={stats["all"]} />
      </div>
      <div className="mt-lg-0 mt-1">
        <StatsBar
          label="Released"
          tooltip="Times Since Release"
          stats={stats["released"]}
        />
      </div>
    </div>
  );
};
export default GradingJobTableStats;
