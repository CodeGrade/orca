import sys
import subprocess
import time
import unittest
import shutil

# Import test case modules
import orca_grader.tests.container.build_script.preprocess.test_cycle_detector as test_cycle_detector
import orca_grader.tests.container.grading_script.test_bash_grading_script_command as test_bash_grading_script_command
import orca_grader.tests.container.grading_script.test_conditional_grading_script_command as test_conditional_grading_script_command
import orca_grader.tests.container.build_script.code_file.test_code_file_info as test_code_file_info
import orca_grader.tests.container.build_script.code_file.test_code_file_processor as test_code_file_processor
import orca_grader.tests.docker_images.test_docker_image_loading as test_docker_image_loading
import orca_grader.tests.container.build_script.preprocess.test_utils as test_preprocess_utils
import orca_grader.tests.common.test_grading_job_result as test_grading_job_result

from os import path

__TIME_FOR_FILE_SERVER_STARTUP = 2  # seconds
__FIXTURE_DIRS_TO_COPY = ["code_files", "images"]


def __copy_fixtures_to_test_server() -> None:
    for dir in __FIXTURE_DIRS_TO_COPY:
        shutil.copytree(path.join("orca_grader/tests/fixtures", dir),
                        path.join("images/testing/simple-server/files", dir), dirs_exist_ok=True)


def __rm_fixtures_from_test_server() -> None:
    for dir in __FIXTURE_DIRS_TO_COPY:
        shutil.rmtree(path.join("images/testing/simple-server/files", dir))


def __start_up_fixture_file_server():
    __copy_fixtures_to_test_server()
    subprocess.run(
        [
            "docker",
            "build",
            "images/testing/simple-server",
            "-f",
            "images/testing/simple-server/Dockerfile",
            "-t",
            "simple-server"
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        check=True
    )
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-d",
            "-p",
            "9000:9000",
            "--name",
            "simple-server",
            "simple-server"
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        check=True
    )
    time.sleep(__TIME_FOR_FILE_SERVER_STARTUP)


def __clean_up_fixture_file_server():
    subprocess.run(
        [
            "docker",
            "stop",
            "-t",
            "0",
            "simple-server"
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        check=True
    )
    __rm_fixtures_from_test_server()


if __name__ == '__main__':
    try:
        sys.stderr.write("Spinning up local file server for testing...")
        __start_up_fixture_file_server()
        sys.stderr.write("Local file server started.")
    except subprocess.CalledProcessError as called_proc_err:
        sys.stderr.write("Could not start up local file server for testing.\n")
        exit(1)
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    # Load Test Cases
    suite.addTests(loader.loadTestsFromModule(test_cycle_detector))
    suite.addTests(loader.loadTestsFromModule(
        test_bash_grading_script_command))
    suite.addTests(loader.loadTestsFromModule(
        test_conditional_grading_script_command))
    suite.addTests(loader.loadTestsFromModule(test_code_file_info))
    suite.addTests(loader.loadTestsFromModule(test_code_file_processor))
    suite.addTests(loader.loadTestsFromModule(test_docker_image_loading))
    suite.addTests(loader.loadTestsFromModule(test_preprocess_utils))
    suite.addTests(loader.loadTestsFromModule(test_grading_job_result))
    runner = unittest.TextTestRunner(verbosity=3)
    result = runner.run(suite)
    try:
        sys.stderr.write("Cleaning up test server...")
        __clean_up_fixture_file_server()
        sys.stderr.write("Clean up complete.")
        exit(0 if result.wasSuccessful() else 1)
    except subprocess.CalledProcessError as called_proc_err:
        sys.stderr.write("Could not successfully clean up testing server.")
        exit(1)
