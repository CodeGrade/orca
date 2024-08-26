import json
import os
import sys
import shutil
import logging
from pathlib import Path
from typing import Dict, List, TextIO
from orca_grader.config import APP_CONFIG
from orca_grader.common.services.push_results import push_results_to_response_url
from orca_grader.container.build_script.preprocess.preprocessor import GradingScriptPreprocessor
from orca_grader.container.exec_secret import GradingJobExecutionSecret
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.grading_script.grading_script_command_response import GradingScriptCommandResponse
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from orca_grader.container.build_script.exceptions import PreprocessingException
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo, json_to_code_file_info
from orca_grader.common.types.grading_job_json_types import (
    GradingJobJSON,
    GradingScriptCommandJSON
)
from orca_grader.container.fs_tree import tree

_LOGGER = logging.getLogger("do_grading" if __name__ != '__main__' else
                            __name__)


def do_grading(secret: str, grading_job_json: GradingJobJSON) -> GradingJobResult:
    command_responses: List[GradingScriptCommandResponse] = []
    interpolated_dirs = {
        "$DOWNLOADED": f"{secret}/downloaded",
        "$EXTRACTED": f"{secret}/extracted",
        "$BUILD": f"{secret}/build"
    }
    # The following exceptions are used to encapsulate things "expected to go wrong":
    # - InvalidGradingJobJSONException*: Thrown when job JSON doesn't match schema (see validations/).
    # - PreprocessingException: Thrown when a GradingJob's script is not valid.
    # Errors encountered by shell during GradingScriptCommand (specifically, BashGradingScriptCommand)
    # are handled in the execute method.
    #
    # *Handled outside in the "if name == '__main__'" section.
    try:
        code_files = produce_code_files_dictionary(grading_job_json["files"])
        commands: List[GradingScriptCommandJSON] = grading_job_json["script"]
        code_file_processor = CodeFileProcessor(interpolated_dirs)
        preprocessor = GradingScriptPreprocessor(secret, commands, code_files,
                                                 code_file_processor)
        script: GradingScriptCommand = preprocessor.preprocess_job()
        _LOGGER.debug("****Directories and their files:****")
        for actual_dir in interpolated_dirs.values():
            _LOGGER.debug(f"{actual_dir}:")
            for line in tree(Path(actual_dir)):
                _LOGGER.debug(line)
        output: GradingJobResult = script.execute(command_responses)
    except PreprocessingException as preprocess_e:
        output = GradingJobResult(command_responses, [preprocess_e])
    except Exception as e:
        output = GradingJobResult(command_responses, [e])
    reverse_interpolated_dirs = {v: k for k, v in interpolated_dirs.items()}
    push_results_to_response_url(output,
                                 grading_job_json["key"],
                                 grading_job_json["container_response_url"]
                                 if "container_response_url" in grading_job_json else
                                 grading_job_json["response_url"],
                                 interpolated_dirs=reverse_interpolated_dirs)
    return output


def produce_code_files_dictionary(code_files_json: Dict[str, any]) \
        -> Dict[str, CodeFileInfo]:
    return {name: json_to_code_file_info(code_file_json, name)
            for (name, code_file_json) in code_files_json.items()}


def get_job_from_input_stream(input_stream: TextIO) -> GradingJobJSON:
    return json.load(input_stream)


def cleanup(secret: str) -> None:
    shutil.rmtree(f"{secret}/")


if __name__ == "__main__":
    # Separate container environment variable
    # This file must exist prior to being set
    # since it relies on an existing docker volume.
    log_file_path = os.getenv("CONTAINER_LOG_FILE_PATH")
    handler = logging.FileHandler(filename=log_file_path) if \
        log_file_path is not None else logging.StreamHandler(stream=sys.stdout)
    logging.basicConfig(level=logging.INFO if APP_CONFIG.environment ==
                        'production' else logging.DEBUG,
                        format='%(asctime)s - %(levelname)s - %(message)s',
                        handlers=[handler])

    secret = GradingJobExecutionSecret.get_secret()
    try:
        file_name = os.getenv('GRADING_JOB_FILE_NAME', 'grading_job.json')
        with open(file_name, 'r') as job_json_fp:
            grading_job = get_job_from_input_stream(job_json_fp)
            do_grading(secret, grading_job)
    except Exception as e:
        output = GradingJobResult([], [e])
        push_results_to_response_url(output,
                                     grading_job["key"],
                                     grading_job["container_response_url"]
                                     if "container_response_url" in grading_job else
                                     grading_job["response_url"],
                                     interpolated_dirs={})
    # cleanup(secret) # useful for execution with no container, but generally optional
