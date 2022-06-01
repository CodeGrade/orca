import sys
import json
from typing import Dict
from jsonschema import validate
from grading_job.grading_job_builder import GradingJobBuilder
from grading_job.grading_job_output import GradingJobOutput
from validations.schemas.grading_job_schema import GradingJobSchema
from grading_job.grading_job import GradingJob
from grading_job.grading_script.grading_script import GradingScript

def get_grading_job_from_stdin() -> GradingJob:
  grading_job_json_str: str = sys.stdin.read()
  try:
    grading_job_json: Dict = json.loads(grading_job_json_str)
    validate(grading_job_json, GradingJobSchema)
    grading_job: GradingJob = build_grading_job_from_json(grading_job_json)
    return grading_job
  except (json.JSONDecodeError, KeyError) as e:
    # TODO: Should we write out the exception message?
    # TODO: Should this just be some sort of JSON object sent back to Orca?
    print(e.msg)
    sys.stderr.write("ERROR: The given grading script (JSON) was malformed and could not be parsed.")
    exit(1)

def build_grading_job_from_json(grading_job_json: Dict) -> GradingJob:
  """
  Given a JSON object for a Grading Job, use the GradingJobBuilder class
  to create an instance of a GradingJob to execute.
  """
  builder = GradingJobBuilder()
  submission_id: str = grading_job_json['submission_id']
  grade_id: str = grading_job_json['grade_id']
  student_code: str = grading_job_json['student_code']
  grading_script: GradingScript = GradingJob.generate_grading_script(grading_job_json['commands'])
  builder.create_grading_job(submission_id, grade_id, student_code, grading_script)
  if 'starter_code' in grading_job_json:
    builder.add_starter_code(grading_job_json['starter_code'])
  if 'professor_code' in grading_job_json:
    builder.add_professor_code(grading_job_json['professor_code'])
  if 'max_retries' in grading_job_json:
    builder.add_max_retries(grading_job_json['max_retries'])
  return builder.get_grading_job()

def do_grading() -> GradingJobOutput:
  grading_job: GradingJob = get_grading_job_from_stdin()
  print(grading_job)

if __name__ == "__main__":
  do_grading()