from typing import Dict

class GradingScriptCommandResponse:
  """
  Response from the execution of a command when running a grading script. 
  Users can query if the response was an error, the output from the command,
  the next place to go (i.e., next command | \"output\" | \"abort\"), and the 
  original command that was executed.

  Possibilities:
    - isError() == true && (next == "abort" || next == "<int>")
    - isError() == false && (next == "output" || next == "<int>")
  """

  def __init__(self, is_error: bool, cmd: str, status_code: int, 
    stdout_output: str = None, stderr_output: str = None, timed_out: bool = False) -> None:
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
  
  def get_next(self) -> str:
    return self.__next
  
  def get_original_cmd(self) -> str:
    return self.__cmd

  def get_status_code(self) -> int:
    return self.__status_code

  def did_time_out(self) -> bool:
    return self.__timed_out
  
  # TODO: Replace with more accurate type.
  def to_json(self) -> Dict[str, any]:
    ans = {
      "cmd": self.__cmd,
      "stdout": self.__stdout_output,
      "stderr": self.__stderr_output,
      "is_error": self.__is_error,
      "did_timeout": self.__timed_out,
      "status_code": self.__status_code
    }
    return ans
