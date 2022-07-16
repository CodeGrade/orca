import React from "react";
import { GradingJobProps } from "../../reducers/grading-job-reducer";
import {
  GradingTableStatsProps,
  getGradingTableStats,
} from "../../../helpers/grading-job-stats";
import StatsBar from "./stats-bar";

const GradingJobTableStats = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  const stats: GradingTableStatsProps = getGradingTableStats(grading_job_queue);

  return (
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center">
      {/* <AllStats stats={stats && stats["all"]} />
      <ReleasedStats stats={stats && stats["released"]} /> */}
      <StatsBar label="Total" tooltip="Wait Times" stats={stats["all"]} />
      <StatsBar
        label="Released"
        tooltip="Times Since Release"
        stats={stats["released"]}
      />
    </div>
  );
};
export default GradingJobTableStats;
