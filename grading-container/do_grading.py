import json
from typing import Dict
from jsonschema import validate
from audit import Audit
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_builder import GradingJobBuilder
from grading_job.grading_job_output import GradingJobOutput
from validations.schemas.grading_job_schema import GradingJobSchema
from grading_job.grading_job import GradingJob

def build_grading_job_from_json(grading_job_json: Dict) -> GradingJob:
  """
  Given a JSON object for a Grading Job, use the GradingJobBuilder class
  to create an instance of a GradingJob to execute.
  """
  pass

def do_grading() -> GradingJobOutput:
  secret = GradingJobExecutionSecret().get_secret()
  pass

if __name__ == "__main__":
  do_grading()