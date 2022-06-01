from typing import List
from validations.grading_job_json_types import GradingScriptOutputJSON


class GradingJobOutput:
  def __init__(self, audit: List[str], grade_id: int, submission_id: int, tap_output: str = None, errors: List[str] = None) -> None:
    self.audit = audit
    self.grade_id = grade_id
    self.submission_id = submission_id
    self.tap_output = tap_output
    self.errors = errors
  
  def to_json(self) -> GradingScriptOutputJSON:
    grading_script_output_json: GradingScriptOutputJSON = {
      "audit": self.audit,
      "grade_id": self.grade_id,
      "submission_id": self.submission_id,
    }
    if self.tap_output:
      grading_script_output_json["tap_output"] = self.tap_output
    if self.errors:
      grading_script_output_json["errors"] = self.errors
    return grading_script_output_json