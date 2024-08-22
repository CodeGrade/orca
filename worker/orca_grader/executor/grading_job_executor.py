import logging
from subprocess import CompletedProcess, CalledProcessError, TimeoutExpired
from typing import Callable, List


_LOGGER = logging.getLogger(__name__)


class ExecutorResult():

    def __init__(self, results: List[str], was_successful: bool,
                 did_timeout: bool):
        self.results = results
        self.was_successful = was_successful
        self.did_timeout = did_timeout


class GradingJobExecutor():

    def __init__(self, grading_subprocesses: List[Callable[[], CompletedProcess]]) -> None:
        self._grading_subprocesses = grading_subprocesses

    def execute(self) -> ExecutorResult:
        results = []
        successful = True
        timed_out = False
        try:
            for sub_proc in self._grading_subprocesses:
                completed = sub_proc()
                cmd = completed.args if type(
                    completed.args) is str else " ".join(completed.args)
                results.append(format_completed_proc_output(
                               cmd,
                               '' if completed.stdout is None else
                               completed.stdout.decode(),
                               '' if completed.stderr is None else
                               completed.stderr.decode()))
        except CalledProcessError as ce:
            results.append(format_completed_proc_output(
                ce.cmd,
                '' if ce.stdout is None else ce.stdout.decode(),
                '' if ce.stderr is None else ce.stderr.decode()
            ))
            successful = False
        except TimeoutExpired as te:
            self._handle_timeout(te)
            timeout_str = f"Timeout limit reached while execution grading job.\n{format_completed_proc_output(te.cmd)}"
            _LOGGER.warn(timeout_str)
            results.append(timeout_str)
            successful = False
            timed_out = True
        except Exception as e:
            _LOGGER.error(f"Encountered exception while execution job: {e}")
            results.append(str(e))
            successful = False
        return ExecutorResult(results, successful, timed_out)

    def _handle_timeout(self, time_err: TimeoutExpired):
        _LOGGER.warn("Timeout handler unimplemented for GradingJobExecutor. Ensure concrete class implements this.")


def format_completed_proc_output(cmd: str, stdout: str = '', stderr: str = '') -> str:
    return f"Cmd: {cmd}\nStdout: {stdout}\nStderr: {stderr}"
