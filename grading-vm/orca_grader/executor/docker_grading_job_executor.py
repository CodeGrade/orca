import subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor
from typing import List, Callable
from subprocess import CompletedProcess, TimeoutExpired

class DockerGradingJobExecutor(GradingJobExecutor):

  __DOCKER_CONTAINER_STOPPAGE_TIMEOUT = 10 # seconds
  __STOP_BUFFER = 5 # seconds; SIGKILL (if necessary) is sent at end of timeout above.

  def __init__(self, grading_subprocess: Callable[[], CompletedProcess], container_sha: str) -> None:
    super().__init__(grading_subprocess)
    self.__container_sha = container_sha

  def _handle_timeout(self, time_err: TimeoutExpired):
    try:
      subprocess.run(["docker", "stop", "-t", f"{self.__DOCKER_CONTAINER_STOPPAGE_TIMEOUT}", self.__container_sha],
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, timeout=self.__DOCKER_CONTAINER_STOPPAGE_TIMEOUT+self.__STOP_BUFFER)
    except TimeoutExpired as stop_time_err:
      print("Failed to stop container.")
      pass
