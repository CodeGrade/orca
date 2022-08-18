import { client } from "../index";

const getGradingJobsFromKeys = async (grading_info_keys: string[]) => {
  const grading_jobs = grading_info_keys.map((key) => client.get(key));
  const results = await Promise.all(grading_jobs);
  return results;
};

const getGradingQueue = async () => {
  const grading_info_keys: string[] = await client.keys("QueuedGradingInfo.*");
  // TODO: Make type model for grading job info
  //   const grading_jobs = await getGradingJobsFromKeys(grading_info_keys);
  let grading_jobs: Object[] = [];
  for (let i = 0; i < grading_info_keys.length; i++) {
    const key = grading_info_keys[i];
    const redis_grading_job = await client.get(key);
    if (!redis_grading_job) {
      // Error retrieving grading job
      // TODO: If getting a key fails for some reason -- returns null
      // do we want the rest of the list?  Or just say it failed?
      return;
    }
    const grading_job = JSON.parse(redis_grading_job);
    grading_jobs.push(grading_job);
  }
  grading_jobs.sort((a, b) => (a["priority"] > b["priority"] ? 1 : -1));
  return grading_jobs;
};
export default getGradingQueue;
