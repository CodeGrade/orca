import logging
import subprocess
from orca_grader.exceptions import InvalidWorkerStateException
from orca_grader.docker_utils.containers import get_all_container_names
from orca_grader.executor.grading_job_executor import GradingJobExecutor
from typing import Callable, List
from subprocess import CalledProcessError, CompletedProcess, TimeoutExpired

_LOGGER = logging.getLogger(__name__)

class DockerGradingJobExecutor(GradingJobExecutor):

    __DOCKER_CONTAINER_STOPPAGE_TIMEOUT = 10  # seconds
    # seconds; SIGKILL (if necessary) is sent at end of timeout above.
    __STOP_BUFFER = 5

    def __init__(self, grading_subprocesses: List[Callable[[], CompletedProcess]], container_name: str) -> None:
        super().__init__(grading_subprocesses)
        self.__container_name = container_name

    def _handle_timeout(self, time_err: TimeoutExpired):
        try:
            subprocess.run(["docker", "stop", "-t", f"{self.__DOCKER_CONTAINER_STOPPAGE_TIMEOUT}", self.__container_name],
                           stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, timeout=self.__DOCKER_CONTAINER_STOPPAGE_TIMEOUT+self.__STOP_BUFFER)
        except TimeoutExpired:
            raise InvalidWorkerStateException()

    def _handle_cleanup(self):
        container_names = get_all_container_names()
        if not self.__container_name in container_names:
            return
        program_args = ["docker", "container", "rm", self.__container_name]
        try:
            subprocess.run(program_args, capture_output=True, check=True)
        except CalledProcessError as cpe:
            _LOGGER.critical(f"Stderr while trying to clean up container: {cpe.stderr.decode() if cpe.stderr is not None else 'None'}")
            raise InvalidWorkerStateException(f"Worker unable to clean up container {self.__container_name} from docker registry.")
