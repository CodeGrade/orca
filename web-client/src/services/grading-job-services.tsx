import axios, { AxiosResponse } from "axios";
import { GradingScriptCommand } from "../components/grading_job_table/types";
import { DeleteJobConfig, MoveJobRequest } from "./types";
// TODO: Environment variable
const API_BASE = "http://localhost:4000/api/v1/grading_queue";

// TODO: Combine these
export const getGradingJobs = async (limit: number, offset: number) => {
  const response: AxiosResponse = await axios.get(API_BASE, {
    params: { limit: limit, offset: offset },
  });
  return response.data;
};

export const getFilteredGradingJobs = async (
  limit: number,
  offset: number,
  filterType: string,
  filterValue: string
) => {
  const response: AxiosResponse = await axios.get(API_BASE, {
    params: {
      limit: limit,
      offset: offset,
      filter_type: filterType,
      filter_value: filterValue,
    },
  });
  return response.data;
};

export const deleteJob = async (deleteJobConfig: DeleteJobConfig) => {
  const response = await axios.delete(`${API_BASE}`, {
    data: { deleteJobConfig },
  });
  return response.data;
};

export const moveJob = async (moveJobRequest: MoveJobRequest) => {
  const response = await axios.put(`${API_BASE}/move`, {
    moveJobRequest,
  });
  return response;
};

// TODO: Move to testing directory/file
/* ===== TEST ===== */
interface GradingJobConfig {
  submission_id: number;
  grade_id: number;
  grader_id: number;
  course_id: number;
  starter_code?: string; // CodeFileInfo;
  student_code: string; // CodeFileInfo;
  professor_code?: string; // CodeFileInfo;
  priority: number; // Delay in ms
  max_retries?: number;
  script: GradingScriptCommand[];
  team_id?: number;
  user_id?: number;
  user_names?: string[];
  submitter_name: string;
}
const createOrUpdateGradingJob = async (gradingJobConfig: GradingJobConfig) => {
  const response = await axios.post(`${API_BASE}`, gradingJobConfig);
  return response;
};

export const createOrUpdateXGradingJobs = async (num_jobs: number) => {
  const responses = [];
  for (let i = 1; i < num_jobs + 1; i++) {
    const grading_job_config: GradingJobConfig = {
      submission_id: i,
      grade_id: i,
      grader_id: i,
      course_id: i,
      student_code: "https://handins.ccs.neu.edu/files/submission.zip",
      priority: Math.min(300000, (i + 1) * 60000), // 5 mins or i + 1 in minutes
      max_retries: 5,
      script: [
        { cmd: "ls", on_fail: 0, on_complete: 1 },
        { cmd: "pwd", on_fail: 0, on_complete: 2 },
        { cmd: "echo 'hello'", on_fail: "abort", on_complete: "output" },
      ],
      user_id: i,
      submitter_name: `student${i}`,
    };
    const response = await createOrUpdateGradingJob(grading_job_config);
    responses.push(response);
  }
  return responses;
};
