import argparse
import concurrent.futures
import json
import os
import time
from typing import List, Optional
import tempfile
import redis
from orca_grader.job_termination.redis.reenqueue import reenqueue_job
from orca_grader.redis_utils import get_redis_client
from orca_grader.common.services.push_results import push_results_with_exception
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.config import APP_CONFIG
from orca_grader.docker_utils.images.clean_up import clean_up_unused_images
from orca_grader.exceptions import InvalidWorkerStateException
from orca_grader.executor.builder.docker_grading_job_executor_builder import DockerGradingJobExecutorBuilder
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.redis.grading_job_retriever import RedisGradingJobRetriever
from orca_grader.docker_utils.images.utils import does_image_exist_locally
from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_from_url, load_image_from_tgz
from orca_grader.job_termination.nonblocking_thread_executor import NonBlockingThreadPoolExecutor
from orca_grader.queue_diagnostics import log_diagnostics
from orca_grader.queue_diagnostics import JobState
from orca_grader.job_termination.stop_worker import GracefulKiller
from orca_grader.validations.exceptions import InvalidGradingJobJSONException
from orca_grader.validations.grading_job import is_valid_grading_job_json

CONTAINER_WORKING_DIR = '/home/orca-grader'

def process_redis_jobs(redis_url: str, no_container: bool, container_command: List[str] | None):
  retriever = RedisGradingJobRetriever(redis_url)
  with GracefulKiller() as killer:
    with NonBlockingThreadPoolExecutor(max_workers=2) as futures_executor:
      stop_future = futures_executor.submit(killer.wait_for_stop_signal)
      while True:
        job_string, timestamp = retriever.retrieve_grading_job()
        job_future = futures_executor.submit(run_grading_job, job_string, no_container, container_command)
        done, not_done = concurrent.futures.wait([stop_future, job_future], return_when="FIRST_COMPLETED")
        # States of job and stop future after wait
        # 1. Stop future done, job_future not done.
        # 2. Stop future not done, job future done.
        # 3. Stop future done, job future done.
        if stop_future in done and job_future in not_done:
          reenqueue_job(json.loads(job_string), timestamp, get_redis_client(redis_url))

        if job_future in done:
          if type(job_future.exception()) == InvalidWorkerStateException:
            exit(1)
          handle_completed_grading_job(job_string, redis_url)
          
        if stop_future in done:
          break

def run_local_job(job_path: str, no_container: bool, container_command: Optional[List[str]]):
  retriever = LocalGradingJobRetriever(job_path)
  job_string = retriever.retrieve_grading_job()
  run_grading_job(job_string, no_container, container_command)
  clean_up_unused_images()

def run_grading_job(json_job_string: str, no_container: bool, container_command: Optional[List[str]]):
  try:
    if not can_execute_job(json_job_string):
      push_results_with_exception(json_job_string, InvalidGradingJobJSONException())
      return
    if no_container:
      handle_grading_job(json_job_string)
      return
    container_sha = get_container_sha(json_job_string)
    if not does_image_exist_locally(container_sha):
      retrieve_image_tgz_from_url(container_sha, f"{APP_CONFIG.orca_web_server_host}/images/{container_sha}.tgz")
      load_image_from_tgz("{0}.tgz".format(container_sha))
    if container_command:
      handle_grading_job(json_job_string, container_sha, container_command)
    else:
      handle_grading_job(json_job_string, container_sha)
  except Exception as e:
    grading_job = json.dumps(json_job_string)
    if "response_url" in grading_job:
      push_results_with_exception(grading_job, e)
    else:
      print(e)

def handle_grading_job(grading_job_json_str: str, container_sha: str | None = None, 
    container_cmd: List[str] | None = None):
  with tempfile.NamedTemporaryFile(mode="w") as temp_job_file:
    file_name = os.path.basename(temp_job_file.name)
    temp_job_file.write(grading_job_json_str)
    temp_job_file.flush()
    if container_sha:
      container_job_path = f"{CONTAINER_WORKING_DIR}/{file_name}"
      builder = DockerGradingJobExecutorBuilder(container_job_path, container_sha, container_cmd) if container_cmd \
          else DockerGradingJobExecutorBuilder(container_job_path, container_sha)
      builder.add_docker_environment_variable_mapping("GRADING_JOB_FILE_NAME", file_name)
      builder.add_docker_volume_mapping(temp_job_file.name, container_job_path)
    else:
      os.environ["GRADING_JOB_FILE_NAME"] = file_name
      builder = GradingJobExecutorBuilder(file_name)
    executor = builder.build()
    result = executor.execute()
    if result and result.stdout:
      print(result.stdout.decode())

def can_execute_job(job_json_string: str) -> bool:
  try:
    return is_valid_grading_job_json(json.loads(job_json_string))
  except json.JSONDecodeError:
    return False

def run_local_job(job_path: str, no_container: bool, container_command: Optional[List[str]]):
  retriever = LocalGradingJobRetriever(job_path)
  job_string = retriever.retrieve_grading_job()
  run_grading_job(job_string, no_container, container_command)
  clean_up_unused_images()

def process_redis_jobs(redis_url: str, no_container: bool, container_command: List[str] | None):
  retriever = RedisGradingJobRetriever(redis_url)
  with GracefulKiller() as killer:
    with NonBlockingThreadPoolExecutor(max_workers=2) as futures_executor:
      stop_future = futures_executor.submit(killer.wait_for_stop_signal)
      while True:
        job_retrieval_future = futures_executor.submit(retriever.retrieve_grading_job)
        done, not_done = concurrent.futures.wait([stop_future, job_retrieval_future], return_when="FIRST_COMPLETED")

        job_string, timestamp = None, None

        if stop_future in done and job_retrieval_future in done:
          if job_retrieval_future.exception() is None:
            job_string, timestamp = job_retrieval_future.result()
            reenqueue_job(json.loads(job_string), timestamp)

        if job_retrieval_future in done:
          if job_retrieval_future.exception():
            print(job_retrieval_future.exception())
            continue
          else:
            job_string, timestamp = job_retrieval_future.result()
        
        if stop_future in done:
          break

        job_execution_future = futures_executor.submit(run_grading_job, job_string, no_container, container_command)
        done, not_done = concurrent.futures.wait([stop_future, job_execution_future], return_when="FIRST_COMPLETED")
        # States of job and stop future after wait
        # 1. Stop future done, job_future not done.
        # 2. Stop future not done, job future done.
        # 3. Stop future done, job future done.
        if stop_future in done and job_execution_future in not_done:
          reenqueue_job(json.loads(job_string), timestamp, get_redis_client(redis_url))

        if job_execution_future in done:
          if type(job_execution_future.exception()) == InvalidWorkerStateException:
            exit(1)
          handle_completed_grading_job(job_string, redis_url)
          
        if stop_future in done:
          break

def reenqueue_job(grading_job_json: GradingJobJSON,
                  original_timestamp: int,
                  client: redis.Redis) -> None:
  if not client.exists(grading_job_json['key']):
    client.set(grading_job_json['orca_key'], json.dumps(grading_job_json))
  client.zadd('Reservations',
              {f'immediate.{grading_job_json["orca_key"]}': 
               original_timestamp})

def handle_completed_grading_job(job_string: str, redis_url: str):
  if APP_CONFIG.enable_diagnostics:
    log_diagnostics(get_redis_client(redis_url), 
                    time.time_ns(), 
                    json.loads(job_string)["key"],
                    JobState.COMPLETED)
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
