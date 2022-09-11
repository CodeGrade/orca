import React from "react";
import { GradingJob } from "../../reducers/grading-job-reducer";
import {
  GradingTableStatsProps,
  getGradingTableStats,
} from "../../../helpers/grading-job-stats";
import StatsBar from "./stats-bar";

const GradingJobTableStats = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJob[];
}) => {
  const stats: GradingTableStatsProps = getGradingTableStats(grading_job_queue);

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
