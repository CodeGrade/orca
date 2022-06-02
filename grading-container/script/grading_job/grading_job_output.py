from typing import List
from validations.grading_job_json_types import GradingScriptOutputJSON


class GradingJobOutput:
  def __init__(self, grade_id: int, submission_id: int, tap_output: str = None, errors: List[str] = None) -> None:
    self.__grade_id = grade_id
    self.__submission_id = submission_id
    self.__tap_output = tap_output
    self.__errors = errors
  
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

  def to_json(self) -> GradingScriptOutputJSON:
    """
    Converts this object to a JSON object (by Python implementation)
    such that it can be be sent back to Orca and Bottlenose.
    """
    grading_script_output_json: GradingScriptOutputJSON = {
      "audit": self.__audit_log,
      "grade_id": self.__grade_id,
      "submission_id": self.__submission_id,
    }
    if self.__tap_output:
      grading_script_output_json["tap_output"] = self.__tap_output
    if self.__errors:
      grading_script_output_json["errors"] = self.__errors
    return grading_script_output_json