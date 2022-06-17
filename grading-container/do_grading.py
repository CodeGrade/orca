import json
from typing import Dict
from jsonschema import validate
from audit import Audit
from grading_job.build_script.code_file_info import CodeFileInfo
from grading_job.build_script.code_file_source import CodeFileSource
from grading_job.build_script.sub_mime_types import SubmissionMIMEType
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_builder import GradingJobBuilder
from grading_job.grading_job_output import GradingJobOutput
from validations.schemas.grading_job_schema import GradingJobSchema
from grading_job.grading_job import GradingJob
from grading_job.grading_script.grading_script import GradingScript

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
  student_code_info = CodeFileInfo(student_code_url, student_code_mime, 
    CodeFileSource.TARGET)
  grading_script: GradingScript = GradingJob.generate_grading_script(grading_job_json['script'])
  builder.create_grading_job(submission_id, grade_id, student_code_info, grading_script)
  if 'starter_code' in grading_job_json:
    start_code_details = grading_job_json['starter_code']
    start_code_url = start_code_details["url"]
    start_code_mime = SubmissionMIMEType(start_code_details["mime_type"])
    builder.add_starter_code(CodeFileInfo(start_code_url, start_code_mime, 
      CodeFileSource.FIXTURE))
  if 'professor_code' in grading_job_json:
    prof_code_details = grading_job_json['professor_code']
    prof_code_url = prof_code_details['url']
    prof_code_mime = SubmissionMIMEType(prof_code_details['mime_type'])
    builder.add_professor_code(CodeFileInfo(prof_code_url, prof_code_mime, 
      CodeFileSource.TEST))
  if 'max_retries' in grading_job_json:
    builder.add_max_retries(grading_job_json['max_retries'])
  return builder.get_grading_job()

def do_grading() -> GradingJobOutput:
  audit = Audit()
  secret = GradingJobExecutionSecret().get_secret()
  example_job_config_path = "tests/fixtures/files/live-URL-student-only.json"
  example_job_config_file = open(example_job_config_path, "r")
  example_job_json = json.load(example_job_config_file)
  example_job_config_file.close()
  example_job = build_grading_job_from_json(example_job_json)
  output = example_job.execute_grading_job(secret, audit)
  json_repr = output.to_json()
  json_str = json.dumps(json_repr)
  print(json_str)


if __name__ == "__main__":
  do_grading()