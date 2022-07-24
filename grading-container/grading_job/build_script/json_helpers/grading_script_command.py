from validations.grading_job_json_types import GradingScriptCommandJSON

def is_test_command(cmd: GradingScriptCommandJSON):
  return "on_false" in cmd and "on_true" in cmd and "check" in cmd

def is_bash_command(cmd: GradingScriptCommandJSON):
  return "on_fail" in cmd and "on_complete" in cmd and "cmd" in cmd