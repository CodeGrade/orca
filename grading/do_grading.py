from re import L
import sys
import json
from grading.scripting.grading_script import GradingScript

from grading.scripting.grading_script_command import GradingScriptCommand

# TODO: Validate this JSON.
def get_grading_script_from_stdin() -> GradingScript:
  gs_json = sys.stdin.read()
  try:
    gs = json.loads(gs_json)
  except:
    sys.stderr.write("ERROR: The given grading script (JSON) was malformed and could not be parsed.")
    exit(1)
  commands = []
  for command in gs['commands']:
    cmd = GradingScriptCommand(command['cmd'], command['on_complete'], command['on_fail'])
    commands.append(cmd)
  GradingScript(commands)

# IO/Side Effect
def do_grading() -> None:
  gs = get_grading_script_from_stdin()

if __name__ == "__main__":
  do_grading()