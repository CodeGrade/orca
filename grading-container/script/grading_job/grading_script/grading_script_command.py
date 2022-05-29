from subprocess import run, CompletedProcess
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse

class GradingScriptCommand:

  def __init__(self, cmd: str, on_complete: str, on_fail: str) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
  
  def exec_cmd(self) -> GradingScriptCommandResponse:
    res: CompletedProcess = run(self.__cmd, capture_output=True, check=True, shell=True)
    if res.stderr:
      return GradingScriptCommandResponse(True, res.stderr.decode(), self.__on_fail, self.__cmd)
    else:
      return GradingScriptCommandResponse(False, res.stdout.decode(), self.__on_complete, self.__cmd)

