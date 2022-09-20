import { GradingJob } from "./types";

// Get the filter info for all filterable fields of a GradingJob
export const getFilterInfo = (grading_jobs: GradingJob[]) => {
  // TODO: make enum
  const filter_types = ["course_id", "grader_id"];
  let filter_info = {};
  filter_types.map((filter_type) => {
    filter_info[filter_type] = [];
  });

  // Get all unique values of each filter type
  grading_jobs.map((grading_job: GradingJob) => {
    filter_types.forEach((filter_type) => {
      const value = grading_job[filter_type as keyof GradingJob];
      if (!filter_info[filter_type].includes(value)) {
        filter_info[filter_type].push(value);
      }
    });
  });
  filter_types.forEach((filter_type) => filter_info[filter_type].sort());
  return filter_info;
};
