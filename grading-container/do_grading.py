import json
import subprocess
from typing import Dict, List
from jsonschema import validate
from jsonschema.exceptions import ValidationError
from exceptions import GradingJobProcessingException
from grading_job.audit import Audit
from grading_job.build_script.code_file.code_file_info import CodeFileInfo
from grading_job.build_script.code_file.code_file_source import CodeFileSource
from grading_job.build_script.preprocess import GradingScriptPreprocessor
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from validations.grading_job_json_types import CodeFileInfoJSON, GradingJobJSON, GradingJobOutputJSON, GradingScriptCommandJSON
from validations.schemas.grading_job_schema import GradingJobSchema

def is_valid_grading_job(json_grading_job: GradingJobJSON):
  try:
    validate(json_grading_job, GradingJobSchema)
    return True
  except ValidationError:
    return False

def push_results_to_bottlenose(grading_job_output: GradingJobOutput):
  json_output: GradingJobOutputJSON = grading_job_output.to_json()
  # TODO: Add an API endpoint URL to Bottlenose
  pass

def clean_up_folders(secret: str):
  subprocess.run(f"rm -rf {secret}/")

def do_grading(json_grading_job: GradingJobOutputJSON) -> GradingJobOutput:
  if not is_valid_grading_job(json_grading_job):
    raise GradingJobProcessingException("The given JSON does not properly match the schema of a GradingJob.")
  secret: str = GradingJobExecutionSecret.get_secret()
  # TODO: Pull credentials (e.g., submission id, student id, etc.)
  code_files: List[CodeFileInfo] = []
  for source in [s.value for s in CodeFileSource]:
    json_code_file: CodeFileInfoJSON = json_grading_job[source]
    code_file = CodeFileInfo(json_code_file["url"], json_code_file["mime_type"], 
      CodeFileSource(source))
    code_files.append(code_file)    
  commands: List[GradingScriptCommandJSON] = json_grading_job["script"]
  if json_grading_job["timeout"]:
    preprocessor = GradingScriptPreprocessor(secret, commands, code_files, json_grading_job["timeout"])
  else:
    preprocessor = GradingScriptPreprocessor(secret, commands, code_files)
  script: GradingScriptCommand = preprocessor.preprocess_job()
  output = script.execute()
  push_results_to_bottlenose(output)
  clean_up_folders()


if __name__ == "__main__":
  test_file = open("tests/fixtures/files/live-URL-student-only.json", "r")
  json_job = json.dump(test_file)
  test_file.close()
  do_grading(json_job)