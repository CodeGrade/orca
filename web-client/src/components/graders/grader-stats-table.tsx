import React from "react";
import { GradingJobProps } from "../reducers/grading-job-reducer";
import GraderStatsItem, { GraderWaitTimeStats } from "./grader-stats-item";
import { getTimeInQueue } from "../../helpers/grading-job-stats";

const GraderStatsTable = ({
  grading_job_queue,
}: {
  grading_job_queue: GradingJobProps[];
}) => {
  type GraderData = {
    [grade_id: number]: number[];
  };

  type GraderStats = {
    [grade_id: number]: GraderWaitTimeStats;
  };

  const getGraderData = (grading_job_queue: GradingJobProps[]): GraderData => {
    const grader_data: GraderData = {};
    grading_job_queue.map((grading_job: GradingJobProps) => {
      const grade_id: number = grading_job.grade_id;
      const created_at: number = grading_job.created_at;
      const wait_time: number = getTimeInQueue(created_at);
      grader_data[grade_id]
        ? grader_data[grade_id].push(wait_time)
        : (grader_data[grade_id] = [wait_time]);
    });
    return grader_data;
  };
  const grader_data = getGraderData(grading_job_queue);

  const getGraderStats = (grader_data: GraderData): GraderStats => {
    const grader_stats: GraderStats = {};
    Object.entries(grader_data).forEach(([grade_id_str, wait_times]) => {
      const grade_id: number = parseInt(grade_id_str);
      const avg_wait: number =
        wait_times.reduce((a, b) => a + b, 0) / wait_times.length;
      const min_wait: number = Math.min(...wait_times);
      const max_wait: number = Math.max(...wait_times);
      const wait_time_stats: GraderWaitTimeStats = {
        avg: avg_wait,
        min: min_wait,
        max: max_wait,
        num_jobs: wait_times.length,
      };
      grader_stats[grade_id] = wait_time_stats;
    });
    return grader_stats;
  };
  const grader_stats: GraderStats = getGraderStats(grader_data);

  return (
    <div className="d-flex justify-content-center align-items-center">
      <ul className="list-group list-group-horizontal text-center">
        <li className="list-group-item bg-info">
          <ul className="list-group">
            <li className="list-group-item active">Grade ID</li>
            <li className="list-group-item">Jobs in Queue</li>
            <li className="list-group-item">Avg Wait Time</li>
            <li className="list-group-item">Min Wait Time</li>
            <li className="list-group-item">Max Wait Time</li>
          </ul>
        </li>
        {Object.keys(grader_stats).map((grade_id_str: string) => {
          const grade_id: number = parseInt(grade_id_str);
          const wait_time_stats: GraderWaitTimeStats = grader_stats[grade_id];
          return (
            <GraderStatsItem
              grade_id={grade_id}
              wait_time_stats={wait_time_stats}
              key={grade_id}
            />
          );
        })}
      </ul>
    </div>
  );
};
export default GraderStatsTable;
