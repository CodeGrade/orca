import time
from typing import Callable, Dict, List
from orca_grader.docker_utils.containers import get_all_container_names
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.executor.builder.utils import create_runnable_job_subprocess
from orca_grader.executor.docker_grading_job_executor import DockerGradingJobExecutor
from orca_grader.executor.grading_job_executor import GradingJobExecutor


class DockerGradingJobExecutorBuilder(GradingJobExecutorBuilder):

    __DEFAULT_CONTIANER_CMD = ["python3.10",
                               "-m", "orca_grader.container.do_grading"]

    def __init__(self, container_sha: str,
                 container_command: List[str] = __DEFAULT_CONTIANER_CMD) -> None:
        self.__container_tag = f"grader-{container_sha}"
        self.__container_command = container_command
        self.__file_mappings: Dict[str, str] = dict()
        self.__env_variable_mappings: Dict[str, str] = dict()

    def __num_containers_with_same_sha(self) -> int:
        filter_op: Callable[[str], bool] = lambda n: n.startswith(
            self.__container_tag)
        return len(list(filter(filter_op, get_all_container_names())))

    def add_docker_volume_mapping(self, local_path: str, container_path: str) -> None:
        self.__file_mappings[local_path] = container_path

    def add_docker_environment_variable_mapping(self, name: str, value: str) -> None:
        self.__env_variable_mappings[name] = value

    def build(self) -> GradingJobExecutor:
        # TODO: How could we maintain a 'reference count' for a unique id?
        container_name = f"{self.__container_tag}_{int(time.time() * 100_000_000)}"
        program_sequence = ["docker", "run", "--rm", "--name", container_name]
        program_sequence.extend(["--network", "orca-testing"])
        for name, value in self.__env_variable_mappings.items():
            program_sequence.append("-e")
            program_sequence.append(f'{name}={value}')
        for local_path, container_path in self.__file_mappings.items():
            program_sequence.append("-v")
            program_sequence.append(f"{local_path}:{container_path}")
        program_sequence.append(self.__container_tag)
        program_sequence.extend(self.__container_command)
        return DockerGradingJobExecutor(create_runnable_job_subprocess(program_sequence), container_name)
