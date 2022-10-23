from common.job_output.grading_job_output import GradingJobOutput

def push_results_to_bottlenose(job_output: GradingJobOutput):
  print(job_output.to_json())
  return True
