from typing import Dict, List
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse


class GradingScriptCommand:
    """
    Represents a single command in a grading script. Either executes a predicate/check
    or a bash command.
    """

    def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobResult:
        pass
