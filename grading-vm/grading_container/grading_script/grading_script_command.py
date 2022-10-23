from typing import Dict, List
from common.job_output.grading_job_output import GradingJobOutput
from grading_container.grading_script.grading_script_command_response import GradingScriptCommandResponse

class GradingScriptCommand:
  """
  Represents a single command in a grading script. Either executes a predicate/check
  or a bash command.
  """

  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
    pass
