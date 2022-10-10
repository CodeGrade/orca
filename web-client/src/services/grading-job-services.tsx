import axios, { AxiosResponse } from "axios";
import { GradingScriptCommand } from "../components/grading_job_table/types";
const API_BASE = "http://localhost:4000/api/v1/grading_queue";

export const getGradingJobQueue = async (limit: number, offset: number) => {
  const response: AxiosResponse = await axios.get(API_BASE, {
    params: { limit: limit, offset: offset },
  });
  return response.data;
};

export const getFilteredGradingJobQueue = async (
  limit: number,
  offset: number,
  filter_type: string,
  filter_value: string
) => {
  const response: AxiosResponse = await axios.get(API_BASE, {
    params: {
      limit: limit,
      offset: offset,
      filter_type: filter_type,
      filter_value: filter_value,
    },
  });
  return response.data;
};

// TODO: Update/Fix depending on how we decide to handle delete
export const deleteGradingJob = async (
  submission_id: number,
  nonce: string
) => {
  // if not using redux then maybe have it hand back the new queue
  const response = await axios.delete(`${API_BASE}/${submission_id}`);
  return response.data;
};

export const moveGradingJob = async (
  submission_id: number,
  nonce: string,
  new_position: string,
  team_id?: number,
  user_id?: number
) => {
  const response = await axios.put(`${API_BASE}/move/${submission_id}`, {
    nonce: nonce,
    priority: new_position,
    team_id: team_id,
    user_id: user_id,
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
const createOrUpdateGradingJob = async (
  grading_job_config: GradingJobConfig
) => {
  const response = await axios.post(`${API_BASE}`, grading_job_config);
  return response;
};

export const createOrUpdateXGradingJobs = async (num_jobs: number) => {
  let responses = [];
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
        { cmd: "ls", on_fail: "0", on_complete: "1" },
        { cmd: "pwd", on_fail: "0", on_complete: "2" },
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
