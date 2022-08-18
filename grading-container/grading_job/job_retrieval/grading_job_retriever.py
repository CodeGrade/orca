from validations.grading_job_json_types import GradingJobJSON
from jsonschema import validate, ValidationError
from validations.schemas.grading_job_schema import GradingJobSchema

class GradingJobRetriever():

  def retrieve_grading_job():
    pass

  @staticmethod
  def is_valid_grading_job(json_grading_job: GradingJobJSON):
    try:
      validate(json_grading_job, GradingJobSchema)
      return True
    except ValidationError:
      return False