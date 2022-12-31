from typing import Dict
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.executor.builder.utils import create_runnable_subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor

class DockerGradingJobExecutorBuilder(GradingJobExecutorBuilder):

  def __init__(self, job_json_path: str, container_tag: str) -> None:
    super().__init__(job_json_path)
    self.__container_tag = container_tag
    self.__file_mappings: Dict[str, str] = dict()

  def add_docker_volume_mapping(self, local_path: str, container_path: str) -> None:
    self.__file_mappings[local_path] = container_path

  def build(self) -> GradingJobExecutor:
    program_sequence = ["docker", "run", self.__container_tag]
    for var, val in self._environment_vars.items():
      program_sequence.append("-e")
      program_sequence.append(f"{var}={val}")
    return GradingJobExecutor([create_runnable_subprocess(program_sequence)])
