import json
import os
import subprocess
from common.job_output.grading_job_output import GradingJobOutput
from common.services.push_results import push_results_to_bottlenose
from job_retrieval.grading_job_retriever import GradingJobRetriever
from job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever

CONTAINER_WORKING_DIR = '/usr/local/grading'
DEFAULT_REDIS_URL = "redis://localhost:6379"

def grading_job_handler(retriever: GradingJobRetriever):
  job_string = retriever.retrieve_grading_job()
  file_name = 'grading_job.json'
  with open(file_name, 'w') as fp:
    fp.write(job_string)
  file_abs_path = os.path.abspath(file_name)
  container_path = f"{CONTAINER_WORKING_DIR}/{file_name}"
  subprocess.run(f"docker run -v {file_abs_path}:{container_path}")

def push_results_with_exception(job_json_string: str, e: Exception):
  # job_json = json.loads(job_json_string) # To be added when credentials are added to output
  output = GradingJobOutput([], [e])
  return push_results_to_bottlenose(output)

if __name__ == "main":
  env_redis_url = os.environ.get("REDIS_URL")
  redis_url = env_redis_url if (env_redis_url is not None) else DEFAULT_REDIS_URL
  retriever = RedisGradingJobRetriever(redis_url)
  grading_job_handler(retriever)
