from subprocess import CalledProcessError, CompletedProcess, run, TimeoutExpired
from tkinter.font import BOLD
from typing import List
from grading_job.grading_job import DEFAULT_COMMAND_TIMEOUT
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.exceptions import CommandFlowIsFinalException
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse


class BashGradingScriptCommand:
  """
  GradingScriptCommand that executes a bash command in the Linux shell.
  """

  def __init__(self, cmd: str, on_complete: GradingScriptCommand = None, 
    on_fail: GradingScriptCommand = None, timeout: int = DEFAULT_COMMAND_TIMEOUT) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
  
  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
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
  
  # NOTE: Python does not have any implementation of `final` (think Java), so this
  # is my hack such that I can determine if something goes wrong during prepreocessing
  # of these commands.
  def set_on_complete_command(self, command: GradingScriptCommand) -> None:
    if self.__on_complete is not None:
      raise CommandFlowIsFinalException("This bash command's on_complete field has already been set.")
    else:
      self.__on_complete = command
  
  def set_on_fail_command(self, command: GradingScriptCommand) -> None:
    if self.__on_fail is not None:
      raise CommandFlowIsFinalException("This bash command's on_fail field has already been set.")
    else:
      self.__on_fail = command