import axios, { AxiosResponse } from "axios";
const API_BASE = "http://localhost:4000/api/grading_jobs";

export const getGradingJobQueue = async () => {
  const response: AxiosResponse = await axios.get(API_BASE);
  return response.data;
};

export const deleteGradingJob = async (grading_job_id: number) => {
  // if not using redux then maybe have it hand back the new queue
  const response = await axios.delete(`${API_BASE}/${grading_job_id}`);
  return response.data;
};

export const moveGradingJob = async (
  grading_job_id: number,
  new_position: string
) => {
  const response = await axios.put(`${API_BASE}/${grading_job_id}`, {
    priority: new_position,
  });
  return response;
};
