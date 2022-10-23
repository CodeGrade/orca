import json
import sys
from typing import List, TextIO
from common.services.push_results import push_results_to_bottlenose
from grading_container.exec_secret import GradingJobExecutionSecret
from common.job_output.grading_job_output import GradingJobOutput
from grading_container.grading_script.grading_script_command import GradingScriptCommand
from grading_container.grading_script.grading_script_command_response import GradingScriptCommandResponse
from grading_container.build_script.preprocess import GradingScriptPreprocessor
from grading_container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from grading_container.build_script.exceptions import PreprocessingException
from grading_container.build_script.code_file.code_file_info import CodeFileInfo
from grading_container.build_script.code_file.code_file_source import CodeFileSource
from grading_container.build_script.code_file.sub_mime_types import SubmissionMIMEType
from grading_container.validations.exceptions import InvalidGradingJobJSONException
from common.types.grading_job_json_types import CodeFileInfoJSON, GradingJobJSON, GradingJobOutputJSON, GradingScriptCommandJSON
from grading_container.validations.schemas.grading_job_schema import GradingJobSchema
from jsonschema import validate, ValidationError

def get_job_from_input_stream(input_stream: TextIO) -> GradingJobJSON:
  try:  
    job_json = json.load(input_stream)
    validate(job_json, GradingJobSchema)
    return job_json
  except json.JSONDecodeError or ValidationError:
    raise InvalidGradingJobJSONException()

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

if __name__ == "__main__":
  try:
    grading_job = get_job_from_input_stream(sys.stdin)
    secret = GradingJobExecutionSecret.get_secret()
  except Exception as e:
    output = GradingJobOutput([], [e])
    push_results_to_bottlenose(output)

