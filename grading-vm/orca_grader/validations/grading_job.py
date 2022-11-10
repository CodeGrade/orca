import os
import jsonschema
from jsonschema import ValidationError
from pathlib import Path
from orca_grader.common.types.grading_job_json_types import GradingJobJSON

def is_valid_grading_job_json(grading_job: GradingJobJSON) -> bool:
  path = Path(f"{os.getcwd()}/orca_grader/validations")
  resolver = jsonschema.RefResolver(
    base_uri = f"{path.as_uri()}/",
    referrer = True
  )
  try:
    jsonschema.validate(
      grading_job,
      schema = { "$ref": "schemas/grading_job_schema.json" },
      resolver = resolver
    )
  except ValidationError:
    return False
  return True
