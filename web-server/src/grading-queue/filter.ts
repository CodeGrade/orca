import { EnrichedGradingJob, FilterInfo, FilterType } from "./types";

export const filterGradingJobs = (
  gradingJobs: EnrichedGradingJob[],
  filterType: string,
  filterValue: string,
): EnrichedGradingJob[] => {
  return gradingJobs.filter(
    (gradingJob) =>
      gradingJob.metadata_table[filterType as keyof EnrichedGradingJob] ==
      filterValue,
  );
};

// Get the filter info for all filterable fields of a GradingJob
export const getFilterInfo = (gradingJobs: EnrichedGradingJob[]) => {
  const filterTypes: string[] = Array.from(Object.values(FilterType));
  let filterInfo: FilterInfo = {};
  filterTypes.map((filterType) => {
    const values: Set<string> = new Set(
      gradingJobs.map(
        (job) => job.metadata_table[filterType as keyof EnrichedGradingJob],
      ),
    );
    filterInfo[filterType] = Array.from(values);
  });
  return filterInfo;
};
