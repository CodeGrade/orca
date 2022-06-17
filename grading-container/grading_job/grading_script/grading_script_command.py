from subprocess import CalledProcessError, run, CompletedProcess, TimeoutExpired
from typing import Dict
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse

class GradingScriptCommand:

  def __init__(self, cmd: str, on_complete: str, on_fail: str, timeout: int) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
  
  # TODO: Switch over to capturing both STDOUT and STDERR
  def exec_cmd(self) -> GradingScriptCommandResponse:
    try:
      proc_res: CompletedProcess = run(self.__cmd, capture_output=True, check=True, shell=True, 
      timeout=self.__timeout)
      return GradingScriptCommandResponse(False, proc_res.stdout.decode(), 
        self.__on_complete, self.__cmd, proc_res.returncode)
    except (TimeoutExpired):
      return GradingScriptCommandResponse(True, "This command timed out when trying to execute.", 
        self.__on_fail, self.__cmd, -1, timed_out=True)
    except (CalledProcessError) as e:
      return GradingScriptCommandResponse(True, e.stderr.decode(), self.__on_fail, self.__cmd, 
        e.returncode)
  
  def get_command_string(self) -> str:
    """
    Get this GradingScriptCommand's shell/bash command to be executed by 
    a GradingScript.
    """
    return self.__cmd
  
  def replace_interpolated_dirs(self, interpolated_dirs: Dict[str, str]) -> None:
    """
    Given a dictionary mapping directory variables to their directory paths, 
    update the command string to use the proper path.

    Dicitonary example:

    { "$ASSETS": "assets",
      "$TARGET": "<secret>_target"
    }
    """
    updated_cmd = self.__cmd
    for dir_key in interpolated_dirs:
      updated_cmd = updated_cmd.replace(dir_key, interpolated_dirs[dir_key])
    self.__cmd = updated_cmd