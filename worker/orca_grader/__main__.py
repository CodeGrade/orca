import argparse
import concurrent.futures
import json
import os
import sys
import time
import logging
from typing import List, Optional
import tempfile
import shutil
from subprocess import CalledProcessError
from orca_grader.common.services.push_results import push_results_with_exception
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.config import APP_CONFIG
from orca_grader.db.operations import reenqueue_job
from orca_grader.docker_utils.images.clean_up import clean_up_unused_images
from orca_grader.exceptions import InvalidWorkerStateException, NoImageNameFoundException
from orca_grader.executor.builder.docker_grading_job_executor_builder import DockerGradingJobExecutorBuilder
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.postgres.grading_job_retriever import PostgresGradingJobRetriever
from orca_grader.docker_utils.images.utils import does_image_exist_locally
from orca_grader.docker_utils.images.image_name import get_image_name_for_sha
from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_for_unique_name, load_image_from_tgz
from orca_grader.job_termination.nonblocking_thread_executor import NonBlockingThreadPoolExecutor
from orca_grader.job_termination.stop_worker import GracefulKiller
from orca_grader.validations.exceptions import InvalidGradingJobJSONException
from orca_grader.validations.grading_job import is_valid_grading_job_json
from orca_grader.common.services.push_status import post_job_status_to_client

CONTAINER_WORKING_DIR = '/home/orca-grader'
_LOGGER = logging.getLogger(__name__)
_SLEEP_LENGTH = 5  # seconds


def run_local_job(job_path: str, no_container: bool,
                  container_command: Optional[List[str]]):
    retriever = LocalGradingJobRetriever(job_path)
    grading_job = retriever.retrieve_grading_job()
    run_grading_job(grading_job, no_container, container_command)
    clean_up_unused_images()


def process_jobs_from_db(no_container: bool,
                         container_command: List[str] | None):
    retriever = PostgresGradingJobRetriever()
    with GracefulKiller() as killer:
        with NonBlockingThreadPoolExecutor(max_workers=2) as futures_executor:
            _LOGGER.info("Job loop initialized.")
            stop_future = futures_executor.submit(killer.wait_for_stop_signal)
            while True:
                job_retrieval_future = futures_executor.submit(
                    retriever.retrieve_grading_job)
                done, not_done = concurrent.futures.wait(
                    [stop_future, job_retrieval_future], return_when="FIRST_COMPLETED")

                grading_job = None

                if stop_future in done and job_retrieval_future in done:
                    if job_retrieval_future.exception() is None:
                        grading_job = job_retrieval_future.result()
                        if grading_job is not None:
                            updated_db_id = reenqueue_job(grading_job)
                            inform_client_of_reenqueue(grading_job,
                                                       updated_db_id)
                            _LOGGER.info(
                                f"Reenqueued job with new database id {updated_db_id}.")

                if job_retrieval_future in done:
                    if job_retrieval_future.exception():
                        _LOGGER.error("Failed to retrieve grading job from postgres:"
                                      f"{job_retrieval_future.exception()}")
                        time.sleep(_SLEEP_LENGTH)
                        continue
                    grading_job = job_retrieval_future.result()
                    if grading_job is None:
                        _LOGGER.debug(
                            f"No jobs on the queue; sleeping for {_SLEEP_LENGTH} seconds.")
                        time.sleep(_SLEEP_LENGTH)
                        continue

                if stop_future in done:
                    break

                post_job_status_to_client(
                    location="Worker",
                    response_url=grading_job['response_url'],
                    key=grading_job['key']
                )
                _LOGGER.info(
                    f"Pulled job with key {grading_job['key']} and url {grading_job['response_url']}"
                )

                job_execution_future = futures_executor.submit(
                    run_grading_job, grading_job,
                    no_container, container_command
                )
                done, not_done = concurrent.futures.wait(
                    [stop_future, job_execution_future], return_when="FIRST_COMPLETED")
                # States of job and stop future after wait
                # 1. Stop future done, job_future not done.
                # 2. Stop future not done, job future done.
                # 3. Stop future done, job future done.
                if stop_future in done and job_execution_future in not_done:
                    updated_db_id = reenqueue_job(grading_job)
                    inform_client_of_reenqueue(grading_job, updated_db_id)
                    _LOGGER.info(
                        f"Reenqueued job with new database id {updated_db_id}.")

                if job_execution_future in done:
                    if type(job_execution_future.exception()) == InvalidWorkerStateException:
                        _LOGGER.critical("This worker has entered an invaid state "
                                         "due to some number of issues with the container. "
                                         f"Exception: {job_execution_future.exception()}")
                        exit(1)
                    _LOGGER.info("Job completed.")
                    clean_up_unused_images()

                if stop_future in done:
                    break


def run_grading_job(grading_job: GradingJobJSON, no_container: bool,
                    container_command: Optional[List[str]]) -> None:
    try:
        if not can_execute_job(grading_job):
            return push_results_with_exception(
                grading_job, InvalidGradingJobJSONException()
            )
        if no_container:
            return handle_grading_job(grading_job)
        container_sha = grading_job["grader_image_sha"]
        image_name = get_image_name_for_sha(container_sha)
        if image_name is None:
            _LOGGER.info(
                f"No image {image_name} found in local docker registry.")
            tgz_file_name = retrieve_image_tgz_for_unique_name(container_sha)
            image_name = load_image_from_tgz(tgz_file_name)
            _LOGGER.debug(f"Expected image name: {image_name}")
            if image_name is None:
                raise NoImageNameFoundException("No image was found from either the "
                                                "local registry or `docker load`"
                                                f"command for {container_sha}")
        if container_command:
            handle_grading_job(grading_job, image_name, container_command)
        else:
            handle_grading_job(grading_job, image_name)
    except Exception as e:
        _LOGGER.exception("Exception encountered while attempting to run this job.")
        if isinstance(e, CalledProcessError):
            stderr_output, stdout_output = [
                encoded_output.decode() if encoded_output is not None else '<None>'
                for encoded_output in [e.stderr, e.stdout]
            ]
            _LOGGER.warning(f"STDERR output of subprocess: {stderr_output}")
            _LOGGER.warning(f"STDOUT output of subprocess: {stdout_output}")
        push_results_with_exception(grading_job, e)


# TODO: Would it be more useful to return the result of the job here?
def handle_grading_job(grading_job: GradingJobJSON, image_name: str | None = None,
                       container_cmd: List[str] | None = None) -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix='.json',
                                     delete_on_close=False) as temp_job_file:
        file_name = os.path.basename(temp_job_file.name)
        _LOGGER.debug(f"Tempfile created at {temp_job_file.name}")
        _LOGGER.debug(
            f"Assert tempfile is file: {os.path.isfile(temp_job_file.name)}")
        # TODO: Can we swap write(json.dump(... with a simple json.dump?
        # Will need to see source code for json.dump.
        temp_job_file.write(json.dumps(grading_job, default=str))
        temp_job_file.flush()
        temp_job_file.close()
        _LOGGER.debug("Job contents written to tempfile.")
        if image_name:
            container_job_path = os.path.join(CONTAINER_WORKING_DIR, file_name)
            builder = DockerGradingJobExecutorBuilder(
                image_name, ["cat", container_job_path]
            )
            # ) if container_cmd else DockerGradingJobExecutorBuilder(
            #     image_name
            # )
            builder.add_docker_environment_variable_mapping(
                "GRADING_JOB_FILE_NAME", file_name
            )
            builder.add_paths_for_docker_cp(
                temp_job_file.name, container_job_path
            )
            if logging_filepath() is not None:
                log_file_name = os.path.basename(logging_filepath)
                container_log_path = os.path.join(CONTAINER_WORKING_DIR,
                                                  log_file_name)
                builder.add_docker_volume_mapping(
                    os.path.abspath(APP_CONFIG.logging_filepath),
                    os.path.join(CONTAINER_WORKING_DIR,
                                 APP_CONFIG.logging_filepath)
                )
                builder.add_docker_environment_variable_mapping(
                    "CONTAINER_LOG_FILE_PATH",
                    container_log_path
                )

            # Allows for new code written to the orca_grader.container
            # module to be automatically picked up while running
            # during development.
            if APP_CONFIG.environment == "development":
                builder.add_docker_volume_mapping(
                    "./orca_grader",
                    os.path.join(CONTAINER_WORKING_DIR, "orca_grader")
                )
        else:
            os.environ["GRADING_JOB_FILE_NAME"] = file_name
            builder = GradingJobExecutorBuilder(file_name)
        executor = builder.build()
        _LOGGER.debug("Grading container launcher built successfully.")
        result = executor.execute()
        if result.was_successful:
            _LOGGER.info("Job was completed successfully.")
        else:
            warn_str = "The processes timed out during execution." if \
                        result.did_timeout else "An error was encountered during execution."
            _LOGGER.warn(warn_str)
        _LOGGER.debug("\n".join(result.results))


def inform_client_of_reenqueue(grading_job: GradingJobJSON,
                               updated_db_id: int) -> None:
    post_job_status_to_client(location="Queue",
                              response_url=grading_job["response_url"],
                              key=grading_job["key"])


def can_execute_job(grading_job: GradingJobJSON) -> bool:
    try:
        return is_valid_grading_job_json(grading_job)
    except json.JSONDecodeError:
        return False


def logging_filepath() -> Optional[str]:
    if APP_CONFIG.worker_logs_dir is not None:
        return os.path.join(APP_CONFIG.worker_logs_dir,
                            f"{APP_CONFIG.environment}.log")
    else:
        return None


if __name__ == "__main__":
    if APP_CONFIG.worker_logs_dir is not None:
        if not os.path.isdir(APP_CONFIG.worker_logs_dir):
            os.makedirs(APP_CONFIG.worker_logs_dir)
        handler = logging.FileHandler(filename=logging_filepath())
    else:
        handler = logging.StreamHandler(stream=sys.stdout)

    logging.basicConfig(level=logging.DEBUG,
                        format='%(asctime)s - %(levelname)s - %(message)s',
                        handlers=[handler])

    _LOGGER.info(f"PostgreSQL connection string: {APP_CONFIG.postgres_url}")
    arg_parser = argparse.ArgumentParser(
        prog="Orca Grader",
        description="Pulls a job from a Redis queue and executes a script to autograde."
    )
    arg_parser.add_argument(
        '--local-job',  help="Specify a local GradingJob JSON file to execute instead of pulling from the queue.")
    arg_parser.add_argument('--no-container',
                            action='store_true',
                            help='When this option is provided, the grader will run on the local machine and not in an isolated container.')
    arg_parser.add_argument('--custom-container-cmd',
                            help="Specify the command to run with given Docker container")
    parse_result = arg_parser.parse_args()
    container_command = parse_result.custom_container_cmd and \
        parse_result.custom_container_cmd.split(' ')
    if parse_result.local_job:
        run_local_job(parse_result.local_job, parse_result.no_container)
    else:
        process_jobs_from_db(
            parse_result.no_container, container_command
        )
