from subprocess import CalledProcessError, CompletedProcess, run, TimeoutExpired
from tkinter.font import BOLD
from typing import List
from grading_job.grading_job import DEFAULT_COMMAND_TIMEOUT
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse


class BashGradingScriptCommand:
  """
  """

  def __init__(self, cmd: str, on_complete: GradingScriptCommand = None, 
    on_fail: GradingScriptCommand = None, timeout: int = DEFAULT_COMMAND_TIMEOUT) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
  

  def execute(self, responses: List[GradingScriptCommandResponse]):
    did_fail: bool = False
    try:
      proc_res: CompletedProcess = run(self.__cmd, timeout=self.__timeout, 
        shell=True, check=True)
      responses.append(GradingScriptCommandResponse(False, self.__cmd, proc_res.returncode, 
        proc_res.stdout))
    except CalledProcessError as cpe:
      responses.append(GradingScriptCommandResponse(True, self.__cmd, 
        cpe.returncode, cpe.stdout, cpe.stderr))
      did_fail = True
    except TimeoutExpired as te:
      responses.append(GradingScriptCommandResponse(True, self.__cmd, -1, 
        te.stdout, te.stderr, True))
      did_fail = True
    
    if did_fail and self.__on_fail:
      return self.__on_fail.execute(responses)
    elif did_fail:
      return GradingJobOutput(responses)
    elif self.__on_complete:
      return self.__on_complete.execute(responses)
    else:
      return responses
