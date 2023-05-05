import argparse
import json
import os
import subprocess
import time
import traceback
from typing import List, Optional
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.common.services import push_results
from orca_grader.common.services.push_results import push_results_to_bottlenose
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.config import APP_CONFIG
from orca_grader.docker_utils.images.clean_up import clean_up_unused_images
from orca_grader.executor.builder.docker_grading_job_executor_builder import DockerGradingJobExecutorBuilder
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.redis.grading_job_retriever import RedisGradingJobRetriever
from orca_grader.docker_utils.images.utils import does_image_exist
from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_from_url, load_image_from_tgz
from orca_grader.validations.exceptions import InvalidGradingJobJSONException
from orca_grader.validations.grading_job import is_valid_grading_job_json

CONTAINER_WORKING_DIR = '/home/orca-grader'

def can_execute_job(job_json_string: str) -> bool:
  try:
    return is_valid_grading_job_json(json.loads(job_json_string))
  except json.JSONDecodeError:
    return False

def run_grading_job(json_job_string: str, no_container: bool, container_command: Optional[List[str]]):
  if no_container:
    handle_grading_job(json_job_string)
    return
  container_sha = get_container_sha(json_job_string)
  if not does_image_exist(container_sha):
    retrieve_image_tgz_from_url(container_sha)
    load_image_from_tgz("{0}.tgz".format(container_sha))
  if container_command:
    handle_grading_job(json_job_string, container_sha, container_command)
  else:
    handle_grading_job(json_job_string, container_sha)

def handle_grading_job(grading_job_json_str: str, container_sha: str | None = None, 
    container_cmd: List[str] | None = None):
  processing_timestamp = int(time.time() * 1_000_000)
  # NOTE: Two containers running at once cannot access the same file simultaneously without 
  # undefined behavior.
  file_name = f'grading_job_{processing_timestamp}.json'
  with open(file_name, 'w') as fp:
    fp.write(grading_job_json_str)
  if container_sha:
    file_abs_path = os.path.abspath(file_name)
    container_job_path = f"{CONTAINER_WORKING_DIR}/{file_name}"
    builder = DockerGradingJobExecutorBuilder(container_job_path, container_sha, container_cmd) if container_cmd \
        else DockerGradingJobExecutorBuilder(container_job_path, container_sha)
    builder.add_docker_environment_variable_mapping("GRADING_JOB_FILE_NAME", file_name)
    builder.add_docker_volume_mapping(file_abs_path, container_job_path)
  else:
    os.environ["GRADING_JOB_FILE_NAME"] = file_name
    builder = GradingJobExecutorBuilder(file_name)
  executor = builder.build()
  try:
    result = executor.execute()
    if result and result.stdout:
      print(result.stdout.decode())
  except subprocess.CalledProcessError as c:
    print(c.stderr.decode())
  except Exception as e:
    traceback.print_exception(e)
    pass
  os.remove(file_name)

def push_results_with_exception(job_json_string: str, e: Exception):
  # job_json = json.loads(job_json_string) # To be added when credentials are added to output
  output = GradingJobOutput([], [e])
  return push_results_to_bottlenose(output)

def run_local_job(job_path: str, no_container: bool, container_command: Optional[List[str]]):
  retriever = LocalGradingJobRetriever(job_path)
  job_string = retriever.retrieve_grading_job()
  if not can_execute_job(job_string):
    push_results_with_exception(job_string, InvalidGradingJobJSONException())
  else:
    run_grading_job(job_string, no_container, container_command)
  clean_up_unused_images()

def process_redis_jobs(redis_url: str, no_container: bool, container_command: List[str] | None):
  retriever = RedisGradingJobRetriever(redis_url)
  while True: 
    job_string = retriever.retrieve_grading_job()
    if not can_execute_job(job_string):
      push_results_with_exception(job_string, InvalidGradingJobJSONException())
      continue
    run_grading_job(job_string, no_container, container_command)
    clean_up_unused_images()

def get_container_sha(json_job_string: str) -> str:
  return json.loads(json_job_string)["grader_image_sha"]

if __name__ == "__main__":
  arg_parser = argparse.ArgumentParser(
      prog="Orca Grader",
      description="Pulls a job from a Redis queue and executes a script to autograde." 
      )
  arg_parser.add_argument('--local-job',  help="Specify a local GradingJob JSON file to execute instead of pulling from the queue.")
  arg_parser.add_argument('--no-container',
      action='store_true',
      help='When this option is provided, the grader will run on the local machine and not in an isolated container.')
  arg_parser.add_argument('--custom-container-cmd', help="Specify the command to run with given Docker container")
  parse_result = arg_parser.parse_args()
  container_command = parse_result.custom_container_cmd and parse_result.custom_container_cmd.split(' ')
  if parse_result.local_job:
    run_local_job(parse_result.local_job, parse_result.no_container)
  else:
    redis_url = APP_CONFIG.redis_db_url
    process_redis_jobs(redis_url, parse_result.no_container, container_command)
