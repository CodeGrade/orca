import { GradingJob, FilterInfo, FilterType } from "../types/grading-queue";

export const filterGradingJobs = (
  gradingJobs: GradingJob[],
  filterType: string,
  filterValue: string,
): GradingJob[] => {
  return gradingJobs.filter(
    (gradingJob) =>
      gradingJob.metadata_table[filterType as keyof GradingJob] == filterValue,
  );
};

// Get the filter info for all filterable fields of a GradingJob
export const getFilterInfo = (gradingJobs: GradingJob[]) => {
  const filterTypes: string[] = Array.from(Object.values(FilterType));
  let filterInfo: FilterInfo = {};
  filterTypes.map((filterType) => {
    const values: Set<string> = new Set(
      gradingJobs.map((job) => job.metadata_table[filterType]).flat(),
    );
    filterInfo[filterType] = Array.from(values);
  });
  return filterInfo;
};
