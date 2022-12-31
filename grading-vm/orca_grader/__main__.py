import argparse
import os
import subprocess
import traceback
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.common.services import push_results
from orca_grader.common.services.push_results import push_results_to_bottlenose
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.executor.builder.docker_grading_job_executor_builder import DockerGradingJobExecutorBuilder
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever
# from orca_grader.job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever
# from orca_grader.validations.exceptions import InvalidGradingJobJSONException
# from orca_grader.validations.grading_job import is_valid_grading_job_json

CONTAINER_WORKING_DIR = '/usr/local/grading'
DEFAULT_REDIS_URL = "redis://localhost:6379"

def handle_single_job(grading_job_json_str: str, no_container: bool):
  file_name = 'grading_job.json'
  with open(file_name, 'w') as fp:
    fp.write(grading_job_json_str)
  if no_container:
    builder = GradingJobExecutorBuilder(file_name)
  else:
    container_tag = "orca-grader:latest"
    file_abs_path = os.path.abspath(file_name)
    container_path = f"{CONTAINER_WORKING_DIR}/{file_name}"
    builder = DockerGradingJobExecutorBuilder(container_path, container_tag)
    builder.add_docker_volume_mapping(file_abs_path, container_path)
  executor = builder.build()
  try:
    result = executor.execute()
    print(result.stdout.decode())
    print(result.stderr.decode())
  except subprocess.CalledProcessError as c:
    print(c.stderr.decode())
  except Exception as e:
    traceback.print_exception(e)
    # TODO: How do we handle this going wrong?
    pass
  os.remove(file_name)

def push_results_with_exception(job_json_string: str, e: Exception):
  # job_json = json.loads(job_json_string) # To be added when credentials are added to output
  output = GradingJobOutput([], [e])
  return push_results_to_bottlenose(output)

def process_redis_jobs(redis_url: str, local_code_files: bool, no_container: bool):
  retriever = RedisGradingJobRetriever(redis_url)
  while True: 
    job_string = retriever.retrieve_grading_job()
    handle_single_job(job_string, local_code_files, no_container)

if __name__ == "__main__":
  arg_parser = argparse.ArgumentParser(
      prog="Orca Grader",
      description="Pulls a job from a Redis queue and executes a script to autograde." 
      )
  arg_parser.add_argument('--local-job',  help="Specify a local GradingJob JSON file to execute instead of pulling from the queue.")
  arg_parser.add_argument('--no-container',
      action='store_true',
      help='When this option is provided, the grader will run on the local machine and not in an isolated container.')
  parse_result = arg_parser.parse_args()
  if parse_result.local_job:
    retriever = LocalGradingJobRetriever(parse_result.local_job)
    job_string = retriever.retrieve_grading_job()
    handle_single_job(job_string, parse_result.no_container)
  else:
    env_redis_url = os.environ.get("REDIS_URL")
    redis_url = env_redis_url if (env_redis_url is not None) else DEFAULT_REDIS_URL
    process_redis_jobs(redis_url, parse_result.no_container)
