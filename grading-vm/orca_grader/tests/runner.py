import subprocess
import sys
import time
import unittest
import shutil

# Import test case modules
import orca_grader.tests.container.build_script.test_cycle_detector as test_cycle_detector
import orca_grader.tests.container.grading_script.test_bash_grading_script_command as test_bash_grading_script_command
import orca_grader.tests.container.grading_script.test_conditional_grading_script_command as test_conditional_grading_script_command
import orca_grader.tests.container.build_script.code_file.test_code_file_info as test_code_file_info
import orca_grader.tests.container.build_script.code_file.test_code_file_processor as test_code_file_processor

__TIME_FOR_FILE_SERVER_STARTUP = 2 # seconds

def __start_up_fixture_file_server():
  shutil.copytree("orca_grader/tests/fixtures/code_files", "test-images/simple-server/files/code_files")
  subprocess.run(
    [
      "docker", 
      "build", 
      "test-images/simple-server",
      "-f",
      "test-images/simple-server/Dockerfile",
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
      "kill",
      "simple-server"  
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.STDOUT,
    check=True
  )
  # NOTE: Container will still be considered to be "hanging" unless
  # running the command below.
  subprocess.run(
    "echo y | docker container prune",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.STDOUT,
    check=True,
    shell=True
  )
  shutil.rmtree("test-images/simple-server/files/code_files")

# TODO: Add logging here for GitHub Actions.
if __name__ == '__main__':
  try:
    __start_up_fixture_file_server()
  except subprocess.CalledProcessError as called_proc_err:
    sys.stderr.write("\n\nCould not start up local file server for testing.")
    exit(1)
  loader = unittest.TestLoader()
  suite = unittest.TestSuite()
  # Load Test Cases
  suite.addTests(loader.loadTestsFromModule(test_cycle_detector))
  suite.addTests(loader.loadTestsFromModule(test_bash_grading_script_command))
  suite.addTests(loader.loadTestsFromModule(test_conditional_grading_script_command))
  suite.addTests(loader.loadTestsFromModule(test_code_file_info))
  suite.addTests(loader.loadTestsFromModule(test_code_file_processor))
  runner = unittest.TextTestRunner(verbosity=3)
  runner.run(suite)
  __clean_up_fixture_file_server()
  