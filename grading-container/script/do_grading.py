import sys
import json
from typing import Dict
from jsonschema import validate
from audit import Audit
from exceptions import GradingJobProcessingException
from grading_job.build_script.code_file_info import CodeFileInfo
from grading_job.build_script.code_file_source import CodeFileSource
from grading_job.build_script.sub_mime_types import SubmissionMIMEType
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_builder import GradingJobBuilder
from grading_job.grading_job_output import GradingJobOutput
from validations.schemas.grading_job_schema import GradingJobSchema
from grading_job.grading_job import GradingJob
from grading_job.grading_script.grading_script import GradingScript

# TODO: Add timeout for reading from STDIN.
# TODO: Add JSON Schema validation exception.
def get_grading_job_from_stdin(audit: Audit) -> GradingJob:
  audit.log("Attempting to read JSON from STDIN...")
  grading_job_json_str: str = sys.stdin.read()
  audit.log("Successfully read JSON from STDIN.")
  try:
    audit.log("Creating grading job for execution...")
    grading_job_json: Dict = json.loads(grading_job_json_str)
    validate(grading_job_json, GradingJobSchema)
    grading_job: GradingJob = build_grading_job_from_json(grading_job_json)
    audit.log("Successfully processed and created the grading job.")
    return grading_job
  except (json.JSONDecodeError, KeyError) as e:
    log_message = f"A grading job could not be created due to the following exception: {e.msg}"
    audit.log_details(log_message, error=True)
    raise GradingJobProcessingException(e.msg)

def build_grading_job_from_json(grading_job_json: Dict) -> GradingJob:
  """
  Given a JSON object for a Grading Job, use the GradingJobBuilder class
  to create an instance of a GradingJob to execute.
  """
  builder = GradingJobBuilder()
  submission_id: str = grading_job_json['submission_id']
  grade_id: str = grading_job_json['grade_id']
  student_code_details = grading_job_json['student_code']
  student_code_url = student_code_details['url']
  student_code_mime = SubmissionMIMEType(student_code_details['mime_type'])
  student_code_info =CodeFileInfo(student_code_url, student_code_mime, 
    CodeFileSource.STUDENT_CODE)
  grading_script: GradingScript = GradingJob.generate_grading_script(grading_job_json['script'])
  builder.create_grading_job(submission_id, grade_id, student_code_info, grading_script)
  if 'starter_code' in grading_job_json:
    start_code_details = grading_job_json['starter_code']
    start_code_url = start_code_details["url"]
    start_code_mime = SubmissionMIMEType(start_code_details["mime_type"])
    builder.add_starter_code(CodeFileInfo(start_code_url, start_code_mime, 
      CodeFileSource.STARTER_CODE))
  if 'professor_code' in grading_job_json:
    prof_code_details = grading_job_json['professor_code']
    prof_code_url = prof_code_details['url']
    prof_code_mime = SubmissionMIMEType(prof_code_details['mime_type'])
    builder.add_professor_code(CodeFileInfo(prof_code_url, prof_code_mime, 
      CodeFileSource.PROFESSOR_CODE))
  if 'max_retries' in grading_job_json:
    builder.add_max_retries(grading_job_json['max_retries'])
  return builder.get_grading_job()

def do_grading() -> GradingJobOutput:
  audit = Audit()
  secret = GradingJobExecutionSecret().get_secret()
  grading_job: GradingJob = get_grading_job_from_stdin(audit)
  output = grading_job.execute_grading_job(secret, audit)
  json_repr = output.to_json()
  json_str = json.dumps(json_repr)
  sys.stdout.write(json_str)


if __name__ == "__main__":
  do_grading()