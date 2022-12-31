from typing import Dict
from orca_grader.executor.builder.utils import create_runnable_subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor

class GradingJobExecutorBuilder():

  def __init__(self, job_json_path: str) -> None:
    self._job_json_path = job_json_path
    self._environment_vars: Dict[str, str] = dict()

  def add_environment_variable(self, var_name: str, value: str) -> None:
    self._environment_vars[var_name] = value

  def build(self) -> GradingJobExecutor:
    callable_subprocesses = []
    for var, val in self._environment_vars.items():
      callable_subprocesses.append(create_runnable_subprocess(f"export {var}={val}"))
    callable_subprocesses.append(
        create_runnable_subprocess(["python", "-m", "orca_grader.container.do_grading", self._job_json_path])
        )
    return GradingJobExecutor(callable_subprocesses)
