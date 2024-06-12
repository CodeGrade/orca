from subprocess import CalledProcessError, CompletedProcess, run, TimeoutExpired
from typing import List
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse


class BashGradingScriptCommand:
  """
  GradingScriptCommand that executes a bash command in the Linux shell.
  """

  def __init__(self, 
    cmd: List[str] | str, 
    timeout: float, 
    on_complete: GradingScriptCommand | None = None,
    on_fail: GradingScriptCommand | None = None, 
    working_dir: str | None = None) -> None:
    self.__cmd = cmd
    self.__on_complete = on_complete
    self.__on_fail = on_fail
    self.__timeout = timeout
    self.__working_dir = working_dir

  def get_on_complete(self) -> GradingScriptCommand:
    return self.__on_complete

  def get_on_fail(self) -> GradingScriptCommand:
    return self.__on_fail

  def get_cmd(self) -> List[str] | str:
    return self.__cmd

  def get_timeout(self) -> float:
    return self.__timeout

  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobResult:
    did_fail: bool = False
    try:
      proc_res: CompletedProcess = run(self.__cmd, timeout=self.__timeout, 
        shell=(type(self.__cmd) == str), check=True, capture_output=True, cwd=self.__working_dir)
      responses.append(GradingScriptCommandResponse(False, self.__cmd, proc_res.returncode, 
        proc_res.stdout.decode().rstrip(), 
        proc_res.stderr.decode().rstrip()))
    except CalledProcessError as cpe:
      responses.append(GradingScriptCommandResponse(True, self.__cmd, cpe.returncode, 
        cpe.stdout.decode().rstrip(), 
        cpe.stderr.decode().rstrip()))
      did_fail = True
    except TimeoutExpired as te:
      # NOTE: stderr and stdout may not be captured, unlike in CalledProcessError
      # and CompletedProcess
      responses.append(GradingScriptCommandResponse(True, self.__cmd, None, 
        te.stdout.decode().rstrip() if te.stdout is not None else "", 
        te.stderr.decode().rstrip() if te.stderr is not None else "", 
        True))
      did_fail = True
    
    if did_fail and self.__on_fail:
      return self.__on_fail.execute(responses)
    elif did_fail:
      return GradingJobResult(responses)
    elif self.__on_complete:
      return self.__on_complete.execute(responses)
    else:
      response_with_tap = responses[-1] # If successful, TAP will be stored in last response.
      return GradingJobResult(responses, output=response_with_tap.get_stdout_output())
  
