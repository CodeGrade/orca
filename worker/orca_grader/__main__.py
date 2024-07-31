import argparse
import concurrent.futures
import json
import os
import time
from typing import List, Optional
import tempfile
from subprocess import CalledProcessError
from orca_grader.common.services.push_results import push_results_with_exception
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.config import APP_CONFIG
from orca_grader.db.operations import reenqueue_job
from orca_grader.docker_utils.images.clean_up import clean_up_unused_images
from orca_grader.exceptions import InvalidWorkerStateException
from orca_grader.executor.builder.docker_grading_job_executor_builder import DockerGradingJobExecutorBuilder
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.job_retrieval.local.local_grading_job_retriever import LocalGradingJobRetriever
from orca_grader.job_retrieval.postgres.grading_job_retriever import PostgresGradingJobRetirever
from orca_grader.docker_utils.images.utils import does_image_exist_locally
from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_from_url, load_image_from_tgz
from orca_grader.job_termination.nonblocking_thread_executor import NonBlockingThreadPoolExecutor
from orca_grader.job_termination.stop_worker import GracefulKiller
from orca_grader.validations.exceptions import InvalidGradingJobJSONException
from orca_grader.validations.grading_job import is_valid_grading_job_json

CONTAINER_WORKING_DIR = '/home/orca-grader'


def run_local_job(job_path: str, no_container: bool,
                  container_command: Optional[List[str]]):
    retriever = LocalGradingJobRetriever(job_path)
    grading_job = retriever.retrieve_grading_job()
    run_grading_job(grading_job, no_container, container_command)
    clean_up_unused_images()


def process_jobs_from_db(no_container: bool,
                         container_command: List[str] | None):
    retriever = PostgresGradingJobRetirever()
    with GracefulKiller() as killer:
        with NonBlockingThreadPoolExecutor(max_workers=2) as futures_executor:
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
                            reenqueue_job(grading_job)

                if job_retrieval_future in done:
                    if job_retrieval_future.exception():
                        # TODO: replace with log statement.
                        print(job_retrieval_future.exception())
                        time.sleep(1)
                        continue
                    grading_job = job_retrieval_future.result()
                    if grading_job is None:
                        time.sleep(1)
                        continue

                if stop_future in done:
                    break

                print(f"Pulled job with key {grading_job['key']} and url {grading_job['response_url']}")

                job_execution_future = futures_executor.submit(
                    run_grading_job, grading_job, no_container, container_command)
                done, not_done = concurrent.futures.wait(
                    [stop_future, job_execution_future], return_when="FIRST_COMPLETED")
                # States of job and stop future after wait
                # 1. Stop future done, job_future not done.
                # 2. Stop future not done, job future done.
                # 3. Stop future done, job future done.
                if stop_future in done and job_execution_future in not_done:
                    reenqueue_job(grading_job)

                if job_execution_future in done:
                    if type(job_execution_future.exception()) == InvalidWorkerStateException:
                        exit(1)
                    print("Job completed.")
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
        if not does_image_exist_locally(f"grader-{container_sha}"):
            retrieve_image_tgz_from_url(
                container_sha, f"{APP_CONFIG.orca_web_server_host}/images/{container_sha}.tgz"
            )
            load_image_from_tgz("{0}.tgz".format(container_sha))
        if container_command:
            handle_grading_job(
                grading_job, container_sha, container_command)
        else:
            handle_grading_job(grading_job, container_sha)
    except Exception as e:
        print(e)
        if type(e) == CalledProcessError:
          print(e.stdout)
          print(e.stderr)
        if "response_url" in grading_job:
            push_results_with_exception(grading_job, e)
        else:
            print(e)


# TODO: Would it be more useful to return the result of the job here?
def handle_grading_job(grading_job: GradingJobJSON, container_sha: str | None = None,
                       container_cmd: List[str] | None = None) -> None:
    with tempfile.NamedTemporaryFile(mode="w") as temp_job_file:
        file_name = os.path.basename(temp_job_file.name)
        # TODO: Can we swap write(json.dump(... with a simple json.dump?
        # Will need to see source code for json.dump.
        temp_job_file.write(json.dumps(grading_job, default=str))
        temp_job_file.flush()
        if container_sha:
            container_job_path = os.path.join(CONTAINER_WORKING_DIR, file_name)
            builder = DockerGradingJobExecutorBuilder(
                container_sha, container_cmd
            ) if container_cmd else DockerGradingJobExecutorBuilder(
                container_sha
            )
            builder.add_docker_environment_variable_mapping(
                "GRADING_JOB_FILE_NAME", file_name
            )
            builder.add_docker_volume_mapping(
                temp_job_file.name, container_job_path
            )
            # Allows for new code written to the orca_grader.container
            # module to be automatically picked up while running
            # during development.
            if APP_CONFIG.environment == "dev":
                builder.add_docker_volume_mapping(
                    "./orca_grader",
                    os.path.join(CONTAINER_WORKING_DIR, "orca_grader")
                )
        else:
            os.environ["GRADING_JOB_FILE_NAME"] = file_name
            builder = GradingJobExecutorBuilder(file_name)
        executor = builder.build()
        result = executor.execute()
        if result and result.stdout:
            # TODO: make this a log statement of some sort.
            print(result.stdout.decode())
        if result and result.stderr:
            print(result.stderr.decode())


def can_execute_job(grading_job: GradingJobJSON) -> bool:
    try:
        return is_valid_grading_job_json(grading_job)
    except json.JSONDecodeError:
        return False


if __name__ == "__main__":
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
