import axios, { AxiosResponse } from "axios";
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
  nonce: number
) => {
  // if not using redux then maybe have it hand back the new queue
  const response = await axios.delete(`${API_BASE}/${submission_id}`);
  return response.data;
};

export const moveGradingJob = async (
  submission_id: number,
  nonce: number,
  new_position: string,
  team_id?: number,
  user_id?: number
) => {
  const response = await axios.put(`${API_BASE}/${submission_id}`, {
    nonce: nonce,
    priority: new_position,
    team_id: team_id,
    user_id: user_id,
  });
  return response;
};
