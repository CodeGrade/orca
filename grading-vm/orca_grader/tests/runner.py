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
  shutil.rmtree("test-images/simple-server/files/code_files")

if __name__ == '__main__':
  try:
    sys.stdout.write("Spinning up local file server for testing...")
    __start_up_fixture_file_server()
    sys.stdout.write("Local file server started.")
  except subprocess.CalledProcessError as called_proc_err:
    sys.stderr.write("Could not start up local file server for testing.\n")
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
  try:
    __clean_up_fixture_file_server()
  except subprocess.CalledProcessError as called_proc_err:
    sys.stderr.write("Could not successfully clean up testing server.")
    exit(1)
  