from subprocess import CalledProcessError, run, CompletedProcess, TimeoutExpired
from typing import Dict, List
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse

class GradingScriptCommand:
  

  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
    """
    """
    pass