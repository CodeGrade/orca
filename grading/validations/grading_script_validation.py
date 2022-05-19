from jsonschema import ValidationError, validate
from grading.validations.schemas.grading_script_schema import GRADING_JOB_SCHEMA


def validate_grading_job_json(grading_job_json: dict):
  """
  Given the JSON object for a grading job, validate that it has the proper 
  data needed to execute.
  """
  try:
    validate(grading_job_json, GRADING_JOB_SCHEMA)
    return True
  except ValidationError as e:
    # Should we possibly return the Exception/message as well?
    return False