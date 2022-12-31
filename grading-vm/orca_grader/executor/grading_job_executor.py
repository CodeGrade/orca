from subprocess import CalledProcessError, CompletedProcess, TimeoutExpired
from typing import Callable, List


class GradingJobExecutor():

  def __init__(self, shell_functions: List[Callable[[], CompletedProcess]]) -> None:
    if len(shell_functions) < 1:
      raise ValueError("List of shell functions to be executed cannot be empty")
    self.__shell_functions = shell_functions

  def execute(self) -> CompletedProcess:
    try:
      results: List[CompletedProcess]  = []
      for func in self.__shell_functions:
        result = func()
        results.append(result)
      return results[-1]
    except CalledProcessError as c:
      # TODO: do something with c
      raise c
    except TimeoutExpired as t:
      raise t
