from orca_grader.executor.builder.utils import create_runnable_subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor

class GradingJobExecutorBuilder():

  def __init__(self, job_json_path: str) -> None:
    self._job_json_path = job_json_path

  def build(self) -> GradingJobExecutor:
    grader_subprocess = create_runnable_subprocess(["python", "-m", "orca_grader.container.do_grading", self._job_json_path])
    return GradingJobExecutor(grader_subprocess)
