import json
import shutil
from typing import List
from grading_job.build_script.code_file.code_file_info import CodeFileInfo
from grading_job.build_script.code_file.code_file_source import CodeFileSource
from grading_job.build_script.code_file.processing.code_file_processing_strategy import CodeFileProcessor
from grading_job.build_script.code_file.sub_mime_types import SubmissionMIMEType
from grading_job.build_script.preprocess import GradingScriptPreprocessor
from grading_job.exec_secret import GradingJobExecutionSecret
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from grading_job.job_retrieval.redis.redis_grading_queue import RedisGradingJobRetriever
from validations.grading_job_json_types import CodeFileInfoJSON, GradingJobJSON, GradingJobOutputJSON, GradingScriptCommandJSON
import os

def push_results_to_bottlenose(grading_job_output: GradingJobOutput) -> bool:
  json_output: GradingJobOutputJSON = grading_job_output.to_json()
  # TODO: Add an API endpoint URL to Bottlenose
  return True

def clean_up_folders(secret: str):
  shutil.rmtree(f"{secret}/")

def do_grading(json_grading_job: GradingJobOutputJSON) -> GradingJobOutput:
  secret: str = GradingJobExecutionSecret.get_secret()
  # TODO: Pull credentials (e.g., submission id, student id, etc.)
  code_files: List[CodeFileInfo] = []
  for source in [s.value for s in CodeFileSource]:
    if source not in json_grading_job:
      continue
    json_code_file: CodeFileInfoJSON = json_grading_job[source]
    code_file = CodeFileInfo(json_code_file["url"], SubmissionMIMEType(json_code_file["mime_type"]), 
      CodeFileSource(source))
    code_files.append(code_file)    
  commands: List[GradingScriptCommandJSON] = json_grading_job["script"]
  if "timeout" in json_grading_job:
    preprocessor = GradingScriptPreprocessor(secret, commands, code_files, CodeFileProcessor(), 
      json_grading_job["timeout"])
  else:
    preprocessor = GradingScriptPreprocessor(secret, commands, code_files, CodeFileProcessor())
  script: GradingScriptCommand = preprocessor.preprocess_job()
  output: GradingJobOutput = script.execute([])
  clean_up_folders(secret)
  print(output.get_tap_output())


if __name__ == "__main__":
  env_redis_url = os.environ.get("REDIS_URL")
  redis_url = env_redis_url if (env_redis_url is not None) else "redis://localhost:6379"
  print(redis_url)
  job_retriever = RedisGradingJobRetriever(redis_url)
  job_json_string = job_retriever.retrieve_grading_job()
  if job_json_string:
    job_json = json.loads(job_json_string)
    do_grading(job_json)
