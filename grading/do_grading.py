import sys
import json

from grading_script.grading_script import GradingScript
from grading_script.grading_script_command import GradingScriptCommand

# TODO: We actually want to snatch the entire grading job JSON.
def get_grading_script_from_stdin() -> GradingScript:
  gs_json = sys.stdin.read()
  try:
    gs = json.loads(gs_json)
    commands = []
    for command in gs['commands']:
      cmd = GradingScriptCommand(command['cmd'], command['on_complete'], command['on_fail'])
      commands.append(cmd)
  except (json.JSONDecodeError, KeyError) as e:
    sys.stderr.write("ERROR: The given grading script (JSON) was malformed and could not be parsed.")
    exit(1)
  return GradingScript(commands, gs['max_retries']) if 'max_retires' in gs else GradingScript(commands)

# IO/Side Effect
def do_grading() -> None:
  gs = get_grading_script_from_stdin()
  result = gs.execute_script()
  return result

if __name__ == "__main__":
  do_grading()