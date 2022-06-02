from subprocess import CalledProcessError, run, CompletedProcess, TimeoutExpired
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse

class GradingScriptCommand:

  def __init__(self, cmd: str, on_complete: str, on_fail: str, timeout: int) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
  
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
