import { SortType } from "../components/grading_job_table/types";

export const LIMIT = 10;
export const OFFSET_START = 0;

// TODO: Move to defaults or config file
// TODO: Let user set their own default table
export const DEFAULT_TABLE = [
  { label: "Submission", prop: "files.student_code.url" },
  {
    label: "Submitter(s)",
    sortType: SortType.SUBMITTER_NAME,
    prop: "metadata_table.submitter_name",
  },
  {
    label: "Grader",
    sortType: SortType.GRADER_ID,
    prop: "metadata_table.grader_id",
  },
  {
    label: "Course",
    sortType: SortType.COURSE_ID,
    prop: "metadata_table.course_id",
  },
  { label: "Wait Time", sortType: SortType.WAIT_TIME, prop: "created_at" },
  { label: "Release", sortType: SortType.RELEASE_AT, prop: "release_at" },
];
