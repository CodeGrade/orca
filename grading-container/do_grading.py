import json
import shutil
from typing import List
from grading_job.build_script.code_file.code_file_info import CodeFileInfo
from grading_job.build_script.code_file.code_file_source import CodeFileSource
from grading_job.build_script.code_file.processing.code_file_processing_strategy import CodeFileProcessor
from grading_job.build_script.code_file.sub_mime_types import SubmissionMIMEType
from grading_job.job_retrieval.exceptions import JobRetrievalException
from grading_job.build_script.exceptions import PreprocessingException
from grading_job.build_script.preprocess import GradingScriptPreprocessor
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse
from grading_job.job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever
from validations.exceptions import InvalidGradingJobJSONException
from validations.grading_job_json_types import CodeFileInfoJSON, GradingJobJSON, GradingJobOutputJSON, GradingScriptCommandJSON
from validations.schemas.grading_job_schema import GradingJobSchema
from jsonschema import validate, ValidationError
import os

DEFAULT_REDIS_URL = "redis://localhost:6379"

def get_grading_job_json_str_from_redis() -> str:
  env_redis_url = os.environ.get("REDIS_URL")
  redis_url = env_redis_url if (env_redis_url is not None) else DEFAULT_REDIS_URL
  job_retriever = RedisGradingJobRetriever(redis_url)
  return job_retriever.retrieve_grading_job()

def parse_grading_job_json(job_json_str: str) -> GradingJobJSON:
  try:  
    job_json = json.load(job_json_str)
    validate(job_json, GradingJobSchema)
    return job_json
  except json.JSONDecodeError or ValidationError:
    raise InvalidGradingJobJSONException()

def push_results_to_bottlenose(grading_job_output: GradingJobOutput) -> bool:
  json_output: GradingJobOutputJSON = grading_job_output.to_json()
  print(json_output)
  # TODO: Add an API endpoint URL to Bottlenose
  return True

def clean_up_folders(secret: str):
  shutil.rmtree(f"{secret}/")

def extract_code_file_info_from_grading_job_json(grading_job_json: GradingJobJSON) -> List[CodeFileInfo]:
  code_files: List[CodeFileInfo] = []
  for source in [s.value for s in CodeFileSource]:
      if source not in grading_job_json:
        continue
      json_code_file: CodeFileInfoJSON = grading_job_json[source]
      code_file = CodeFileInfo(json_code_file["url"], SubmissionMIMEType(json_code_file["mime_type"]), 
        CodeFileSource(source))
      code_files.append(code_file)
  return code_files

def do_grading(secret: str, grading_job_json: GradingJobJSON) -> GradingJobOutput:
  secret: str = GradingJobExecutionSecret.get_secret()
  command_responses: List[GradingScriptCommandResponse] = []
  # The following exceptions are used to encapsulate things "expected to go wrong":
  # - GradingJobRetrievalException*: Thrown when encountering issue with Redis.
  # - InvalidGradingJobJSONException*: Thrown when job JSON doesn't match schema (see validations/).
  # - PreprocessingException: Thrown when GradingJobJSON is not valid.
  # Errors encountered by shell during GradingScriptCommand (specifically, BashGradingScriptCommand)
  # are handled in the execute method.
  #
  # *Handled outside in the "if name == '__main__'" section.
  try:
    # TODO: Pull credentials (e.g., submission id, student id, etc.) 
    code_files = extract_code_file_info_from_grading_job_json(grading_job_json)
    commands: List[GradingScriptCommandJSON] = grading_job_json["script"]
    if "timeout" in grading_job_json:
      preprocessor = GradingScriptPreprocessor(secret, commands, code_files, CodeFileProcessor(), 
        grading_job_json["timeout"])
    else:
      preprocessor = GradingScriptPreprocessor(secret, commands, code_files, CodeFileProcessor())
    script: GradingScriptCommand = preprocessor.preprocess_job()
    output: GradingJobOutput = script.execute(command_responses)
  except PreprocessingException as preprocess_e:
    output = GradingJobOutput(command_responses, [preprocess_e])
  except Exception as e:
    output = GradingJobOutput(command_responses, [e])
  push_results_to_bottlenose(output)
  clean_up_folders(secret) # This is pointless if Docker can do it anyways.


if __name__ == "__main__":
  secret: str = GradingJobExecutionSecret.get_secret()
  command_responses: List[GradingScriptCommandResponse] = []
  try:
    job_json_string = get_grading_job_json_str_from_redis()
    job_json = json.loads(job_json_string)
    output = do_grading(job_json)
  except JobRetrievalException as retrieve_job_e:
    output = GradingJobOutput([], [retrieve_job_e])
  except InvalidGradingJobJSONException as bad_json_e:
    output = GradingJobOutput([], [bad_json_e])
