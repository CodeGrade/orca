from typing import Dict, List


def replace_paths_in_str(str_or_list: str | List[str], interpolated_dirs: Dict[str, str]) -> str:
    result = str_or_list
    for k, v in interpolated_dirs.items():
        if type(result) is str:
            result = result.replace(k, v)
        else:
            result = [s.replace(k, v) for s in result]
    return result


class GradingScriptCommandResponse:
    """
    Response from the execution of a command when running a grading script.
    Exposes methods to query if the response was an error, the output from the command,
    and the original command that was executed.
    """

    def __init__(self, is_error: bool, cmd: List[str] | str, status_code: int,
                 stdout_output: str, stderr_output: str, timed_out: bool = False) -> None:
        self.__is_error = is_error
        self.__stdout_output = stdout_output
        self.__stderr_output = stderr_output
        self.__cmd = cmd
        self.__status_code = status_code
        self.__timed_out = timed_out

    def is_error(self) -> bool:
        return self.__is_error

    def get_stdout_output(self) -> str:
        return self.__stdout_output

    def get_stderr_output(self) -> str:
        return self.__stderr_output

    def get_original_cmd(self) -> List[str] | str:
        return self.__cmd

    def get_status_code(self) -> int:
        return self.__status_code

    def did_time_out(self) -> bool:
        return self.__timed_out

    # TODO: Replace with more accurate type.
    def to_json(self, interpolated_dirs: Dict[str, str]) -> Dict[str, any]:
        return {
            "cmd": replace_paths_in_str(self.__cmd, interpolated_dirs),
            "stdout": replace_paths_in_str(self.__stdout_output, interpolated_dirs),
            "stderr": replace_paths_in_str(self.__stderr_output, interpolated_dirs),
            "is_error": self.__is_error,
            "did_timeout": self.__timed_out,
            "status_code": self.__status_code
        }
