import sys
import json
from jsonschema import validate
from grading_job.grading_script.grading_script_output import GradingScriptOutput
from validations.schemas.grading_script_schema import GradingJobSchema
from grading_job.grading_job import GradingJob
from grading_job.grading_script.grading_script import GradingScript
from grading_job.grading_script.grading_script_command import GradingScriptCommand

# TODO: We actually want to snatch the entire grading job JSON.
# TODO: Builder pattern for GradingJob
def get_grading_script_from_stdin() -> GradingScript:
  gj_json = sys.stdin.read()
  try:
    gj = json.loads(gj_json)
    validate(gj, GradingJobSchema)
  except (json.JSONDecodeError, KeyError) as e:
    sys.stderr.write("ERROR: The given grading script (JSON) was malformed and could not be parsed.")
    exit(1)

def do_grading() -> GradingScriptOutput:
  gs = get_grading_script_from_stdin()
  result = gs.execute_script()
  return result

if __name__ == "__main__":
  do_grading()