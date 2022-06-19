import axios from "axios";

export const getGradingJobQueue = async () => {
  const response = await axios.get("http://localhost:4000/api/grading_jobs/");
  return response.data;
};
