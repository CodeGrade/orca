import subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor
from typing import List, Callable
from subprocess import CompletedProcess, TimeoutExpired

DOCKER_CONTAINER_STOPPAGE_TIMEOUT = 10 # seconds

class DockerGradingJobExecutor(GradingJobExecutor):

  def __init__(self, shell_functions: List[Callable[[], CompletedProcess]], container_sha: str) -> None:
    super().__init__(shell_functions)
    self.__container_sha = container_sha

  def _handle_timeout(self, time_err: TimeoutExpired):
    try:
      subprocess.run(["docker", "stop", self.__container_sha], capture_output=True,
          stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, timeout=DOCKER_CONTAINER_STOPPAGE_TIMEOUT)
    except TimeoutExpired as timeout_err:
      pass
