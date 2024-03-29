from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON

RESERVED_KEYWORDS = {'next', 'abort', 'output'}

def is_conditional_command(cmd: GradingScriptCommandJSON):
  return "condition" in cmd

def is_bash_command(cmd: GradingScriptCommandJSON):
  return "cmd" in cmd
