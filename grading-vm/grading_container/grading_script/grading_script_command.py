from typing import Dict, List
from grading_container.grading_script.grading_script_command_response import GradingScriptCommandResponse
from grading_container.output.grading_job_output import GradingJobOutput

class GradingScriptCommand:
  """
  Represents a single command in a grading script. Either executes a predicate/check
  or a bash command.
  """

  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
    pass
