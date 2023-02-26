from typing import Dict, List
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.executor.builder.utils import create_runnable_subprocess
from orca_grader.executor.grading_job_executor import GradingJobExecutor

__DEFAULT_CONTIANER_CMD = ["python3", "-m", "orca_grader.container.do_grading", "grading_job.json"]

class DockerGradingJobExecutorBuilder(GradingJobExecutorBuilder):

  def __init__(self, job_json_path: str, container_sha: str, 
      container_command: List[str] = __DEFAULT_CONTIANER_CMD) -> None:
    super().__init__(job_json_path)
    self.__container_sha = container_sha
    self.__container_command = container_command
    self.__file_mappings: Dict[str, str] = dict()

  def add_docker_volume_mapping(self, local_path: str, container_path: str) -> None:
    self.__file_mappings[local_path] = container_path

  def build(self) -> GradingJobExecutor:
    program_sequence = ["docker", "run", self.__container_sha, "--name", self.__container_sha]
    for local_path, container_path in self.__file_mappings.items():
      program_sequence.append("-v")
      program_sequence.append(f"{local_path}:{container_path}")
    program_sequence.extend(self.__container_command)
    return GradingJobExecutor(create_runnable_subprocess(program_sequence))

