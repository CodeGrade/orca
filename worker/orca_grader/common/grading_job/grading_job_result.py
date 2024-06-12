from typing import List, Optional
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse
from orca_grader.common.types.grading_job_json_types import GradingJobOutputJSON, GradingJobOutputJSON

class GradingJobResult:
  
  def __init__(self, command_responses: List[GradingScriptCommandResponse],
               execution_errors: List[Exception] = [],
               output: str = None) -> None:
    self.__command_responses = command_responses
    self.__execution_errors = execution_errors
    self.__output = output
  
  def get_command_responses(self) -> List[GradingScriptCommandResponse]:
    return self.__command_responses
  
  def get_output(self) -> Optional[str]:
    return self.__output
  
  def get_execution_errors(self) -> List[Exception]:
    return self.__execution_errors
  
  def to_json(self) -> GradingJobOutputJSON:
    result = dict()
    json_responses = list(map(lambda c: c.to_json(), self.__command_responses))
    result["shell_responses"] = json_responses
    if self.__execution_errors is not None:
      result["errors"] = list(map(lambda e: f"{e.__class__.__name__}: {e}", self.__execution_errors))
    if self.__output is not None:
      result["output"] = self.__output
    return result
