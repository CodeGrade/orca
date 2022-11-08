import { GradingJob, FilterInfo, FilterType, FilterSettings } from "./types";

// TODO: Find out the desired behavior of filter
// Right now, it returns all jobs that meet AT LEAST 1 filter requirement
// Should this instead only return jobs that meet ALL filter requirements
export const filterGradingJobs = (
  gradingJobs: GradingJob[],
  filterInfo: FilterInfo,
  filterSettings: FilterSettings,
): GradingJob[] => {
  let allJobs = [...gradingJobs];
  let filteredJobs: GradingJob[] = [];
  // Apply settings
  const and = filterSettings.and;

  if (and) {
    filteredJobs = allJobs;
    Object.entries(filterInfo).map(([filterType, filterValues]) => {
      filterValues.forEach((value) => {
        const filteredByValue = filteredJobs.filter(
          (job) => job.metadata_table[filterType] === value,
        );
        filteredJobs = [...filteredByValue];
      });
    });
    return [...new Set(filteredJobs)];
  } else {
    Object.entries(filterInfo).map(([filterType, filterValues]) => {
      filterValues.forEach((value) => {
        const filteredByValue = allJobs.filter(
          (job) => job.metadata_table[filterType] === value,
        );
        filteredJobs.push(...filteredByValue);
      });
    });
    return [...new Set(filteredJobs)];
  }
};

// Get the filter info for all filterable fields of a GradingJob
export const getFilterInfo = (gradingJobs: GradingJob[]) => {
  const filterTypes: string[] = Array.from(Object.values(FilterType));
  let filterInfo: FilterInfo = {};
  filterTypes.map((filterType) => {
    const values: Set<string> = new Set(
      gradingJobs.map(
        (job) => job.metadata_table[filterType as keyof GradingJob],
      ),
    );
    filterInfo[filterType] = Array.from(values);
  });
  return filterInfo;
};
