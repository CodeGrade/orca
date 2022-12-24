import json
import sys
import traceback
from typing import Dict, List, TextIO
from orca_grader.common.services.push_results import push_results_to_bottlenose
from orca_grader.container.exec_secret import GradingJobExecutionSecret
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse
from orca_grader.container.build_script.preprocess import GradingScriptPreprocessor
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from orca_grader.container.build_script.exceptions import PreprocessingException
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo, json_to_code_file_info
from orca_grader.container.build_script.code_file.code_file_source import CodeFileSource
from orca_grader.container.build_script.code_file.sub_mime_types import SubmissionMIMEType
from orca_grader.common.types.grading_job_json_types import CodeFileInfoJSON, GradingJobJSON, GradingJobOutputJSON, GradingScriptCommandJSON

def get_job_from_input_stream(input_stream: TextIO) -> GradingJobJSON:
  return json.load(input_stream)

def produce_code_files_dictionary(code_files_json: Dict[str, any]) -> Dict[str, CodeFileInfo]:
  return { name: json_to_code_file_info(code_file_json, name) for (name, code_file_json) in code_files_json.items() }
    

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
    code_files = produce_code_files_dictionary(grading_job_json["code_files"])
    print(code_files)
    commands: List[GradingScriptCommandJSON] = grading_job_json["script"]
    interpolated_dirs = {
      "$ASSETS": "assets",
      "$DOWNLOADED": f"{secret}/downloaded",
      "$EXTRACTED": f"{secret}/extracted",
      "$BUILD": f"{secret}/build"
    }
    if "timeout" in grading_job_json:
      preprocessor = GradingScriptPreprocessor(secret, commands, code_files,
        CodeFileProcessor(interpolated_dirs), grading_job_json["timeout"])
    else:
      preprocessor = GradingScriptPreprocessor(secret, commands, code_files, 
        CodeFileProcessor(interpolated_dirs))
    script: GradingScriptCommand = preprocessor.preprocess_job()
    output: GradingJobOutput = script.execute(command_responses)
  except PreprocessingException as preprocess_e:
    output = GradingJobOutput(command_responses, [preprocess_e])
  except Exception as e:
    traceback.print_tb(e.__traceback__)
    output = GradingJobOutput(command_responses, [e])
  push_results_to_bottlenose(output)

if __name__ == "__main__":
  try:
    _, file_name = sys.argv
    job_json_fp = open(file_name, 'r')
    grading_job = get_job_from_input_stream(job_json_fp)
    job_json_fp.close()
    secret = GradingJobExecutionSecret.get_secret()
    do_grading(secret, grading_job)
  except Exception as e:
    output = GradingJobOutput([], [e])
    push_results_to_bottlenose(output)

