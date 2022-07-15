from typing import List
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse
from validations.grading_job_json_types import GradingJobOutputJSON, GradingJobOutputJSON

class GradingJobOutput:
  
  def __init__(self, command_responses: List[GradingScriptCommandResponse], tap_output: str = None) -> None:
    self.__command_responses = command_responses
    self.__tap_output = tap_output
  
  def set_audit_log(self, audit_log: List[str]) -> None:
    """
    Adds the log from an Audit to the output of the grading job.
    This is added separately because of the following workflow:
      - An audit exists throughout the entire duration of the program,
        and is appended to as various steps are executed prior to running
        a script.
      - The script will return an GradingJobOutput object after it is done running.
      - The audit is still needed after this object is returned since we need to log
        whether or not the script ran successfully. Only aftet that is the log added 
        to this object.
    """
    self.__audit_log = audit_log

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
