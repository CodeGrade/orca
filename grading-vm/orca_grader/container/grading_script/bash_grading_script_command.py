from subprocess import CalledProcessError, CompletedProcess, run, TimeoutExpired
from typing import List
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse


class BashGradingScriptCommand:
  """
  GradingScriptCommand that executes a bash command in the Linux shell.
  """

  def __init__(self, cmd: str, timeout: int, on_complete: GradingScriptCommand = None, 
    on_fail: GradingScriptCommand = None) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
  
  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
    did_fail: bool = False
    try:
      proc_res: CompletedProcess = run(self.__cmd, timeout=self.__timeout, 
        shell=True, check=True, capture_output=True)
      responses.append(GradingScriptCommandResponse(False, self.__cmd, proc_res.returncode, 
        proc_res.stdout.decode()))
    except CalledProcessError as cpe:
      responses.append(GradingScriptCommandResponse(True, self.__cmd, 
        cpe.returncode, cpe.stdout.decode(), cpe.stderr.decode()))
      did_fail = True
    except TimeoutExpired as te:
      responses.append(GradingScriptCommandResponse(True, self.__cmd, None, 
        te.stdout.decode(), te.stderr.decode(), True))
      did_fail = True
    
    if did_fail and self.__on_fail:
      return self.__on_fail.execute(responses)
    elif did_fail:
      return GradingJobOutput(responses)
    elif self.__on_complete:
      return self.__on_complete.execute(responses)
    else:
      response_with_tap = responses[-1] # If successful, TAP will be stored in last response.
      return GradingJobOutput(responses, tap_output=response_with_tap.get_stdout_output())
  