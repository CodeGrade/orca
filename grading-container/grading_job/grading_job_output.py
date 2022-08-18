from typing import List
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse
from validations.grading_job_json_types import GradingJobOutputJSON, GradingJobOutputJSON

class GradingJobOutput:
  
  def __init__(self, command_responses: List[GradingScriptCommandResponse], tap_output: str = None) -> None:
    self.__command_responses = command_responses
    self.__tap_output = tap_output

  def has_tap_output(self) -> bool:
    return self.__tap_output is not None
  
  def get_command_responses(self) -> List[GradingScriptCommandResponse]:
    return self.__command_responses
  
  def get_tap_output(self) -> str:
    return self.__tap_output
  
  def to_json(self) -> GradingJobOutputJSON:
    json_responses = list(map(lambda c: c.to_json(), self.__command_responses))
    ans = { "execution_responses": json_responses }
    if self.has_tap_output():
      ans["tap_output"] = self.__tap_output
    return ans
