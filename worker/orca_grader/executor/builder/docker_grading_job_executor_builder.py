import time
import re
from subprocess import CompletedProcess
from typing import Callable, Dict, List
from orca_grader.docker_utils.containers import get_all_container_names
from orca_grader.executor.builder.grading_job_executor_builder import GradingJobExecutorBuilder
from orca_grader.executor.builder.utils import create_runnable_job_subprocess
from orca_grader.executor.docker_grading_job_executor import DockerGradingJobExecutor
from orca_grader.executor.grading_job_executor import GradingJobExecutor


class DockerGradingJobExecutorBuilder(GradingJobExecutorBuilder):

    __DEFAULT_CONTIANER_CMD = ["python3.10",
                               "-m", "orca_grader.container.do_grading"]

    def __init__(self, image_name: str,
                 container_command: List[str] = __DEFAULT_CONTIANER_CMD) -> None:
        self.__image_name = image_name
        self.__container_command = container_command
        self.__volume_mappings: Dict[str, str] = dict()
        self.__env_variable_mappings: Dict[str, str] = dict()
        self.__to_copy = dict()

    def __num_containers_with_same_sha(self) -> int:
        filter_op: Callable[[str], bool] = lambda n: n.startswith(
            self.__image_name)
        return len(list(filter(filter_op, get_all_container_names())))

    def add_docker_volume_mapping(self, local_path: str, container_path: str) -> None:
        self.__volume_mappings[local_path] = container_path

    def add_docker_environment_variable_mapping(self, name: str, value: str) -> None:
        self.__env_variable_mappings[name] = value

    def add_paths_for_docker_cp(self, src: str, dest: str) -> None:
        self.__to_copy[src] = dest

    def __create_container_create_command(self, container_name):
        program_sequence = [
            "docker",
            "container",
            "create",
            "--rm",
            "--name",
            container_name
        ]
        program_sequence.extend(["--network", "host"])
        for name, value in self.__env_variable_mappings.items():
            program_sequence.append("-e")
            program_sequence.append(f'{name}={value}')
        for local_path, container_path in self.__volume_mappings.items():
            program_sequence.append("-v")
            program_sequence.append(f"{local_path}:{container_path}")
        program_sequence.append(self.__image_name)
        program_sequence.extend(self.__container_command)
        return create_runnable_job_subprocess(program_sequence)

    def __create_container_start_subprocess(self, container_name: str) -> Callable[[], CompletedProcess]:
        program_args = [
            "docker",
            "container",
            "start",
            container_name
        ]
        return create_runnable_job_subprocess(program_args)


    def __create_container_cp_subprocesses(self, container_name: str) -> List[Callable[[], CompletedProcess]]:
        subprocs = []
        for src, dest in self.__to_copy.items():
            program_sequence = [
                "docker",
                "container",
                "cp",
                src,
                f"{container_name}:{dest}"
            ]
            subprocs.append(create_runnable_job_subprocess(program_sequence))
        return subprocs

    def build(self) -> GradingJobExecutor:
        # TODO: How could we maintain a 'reference count' for a unique id?
        sanitized_image_name = re.sub(
            r'[^a-zA-Z0-9_.-]', '_', self.__image_name)
        container_name = f"{sanitized_image_name}_{int(time.time() * 100_000_000)}"
        subprocs = [self.__create_container_create_command(container_name)]
        subprocs.extend(self.__create_container_cp_subprocesses(container_name))
        subprocs.append(self.__create_container_start_subprocess(container_name))
        return DockerGradingJobExecutor(subprocs, container_name)
