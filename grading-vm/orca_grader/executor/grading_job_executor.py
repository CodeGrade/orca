from subprocess import CompletedProcess, TimeoutExpired
from typing import Callable

class GradingJobExecutor():

  def __init__(self, grading_subprocess: Callable[[], CompletedProcess]) -> None:
    self._grading_subprocess = grading_subprocess

  def execute(self) -> CompletedProcess:
    try:
      result = self._grading_subprocess()
      return result
    except TimeoutExpired as time_err:
      self._handle_timeout(time_err)

  def _handle_timeout(self, time_err: TimeoutExpired):
    raise time_err

