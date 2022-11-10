import json
import os
import subprocess
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.common.services.push_results import push_results_to_bottlenose
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever
from orca_grader.validations.exceptions import InvalidGradingJobJSONException
from orca_grader.validations.grading_job import is_valid_grading_job_json

CONTAINER_WORKING_DIR = '/usr/local/grading'
DEFAULT_REDIS_URL = "redis://localhost:6379"

def grading_job_handler(retriever: GradingJobRetriever):
  job_string = retriever.retrieve_grading_job()
  # if not is_valid_grading_job_json(json.loads(job_string)):
  #   raise InvalidGradingJobJSONException()
  file_name = 'grading_job.json'
  with open(file_name, 'w') as fp:
    fp.write(job_string)
  file_abs_path = os.path.abspath(file_name)
  container_path = f"{CONTAINER_WORKING_DIR}/{file_name}"
  try:
    result = subprocess.run(f"docker run -v {file_abs_path}:{container_path} orca-grader:latest python3 -m orca_grader.container.do_grading {file_name}", 
      capture_output=True, shell=True)
    print(result.stdout.decode())
    print(result.stderr.decode())
  except Exception as e:
    push_results_with_exception(job_string, e)

def push_results_with_exception(job_json_string: str, e: Exception):
  # job_json = json.loads(job_json_string) # To be added when credentials are added to output
  output = GradingJobOutput([], [e])
  return push_results_to_bottlenose(output)

if __name__ == "__main__":
  env_redis_url = os.environ.get("REDIS_URL")
  redis_url = env_redis_url if (env_redis_url is not None) else DEFAULT_REDIS_URL
  retriever = LocalGradingJobRetriever("orca_grader/tests/fixtures/files/live-URL-student-only.json")
  grading_job_handler(retriever)
