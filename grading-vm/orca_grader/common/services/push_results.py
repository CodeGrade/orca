import json
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput

def push_results_to_bottlenose(job_output: GradingJobOutput):
  print(json.dumps(job_output.to_json()))
  return True
