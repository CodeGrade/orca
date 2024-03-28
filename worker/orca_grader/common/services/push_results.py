import json
import random
import time
import requests
from requests import HTTPError
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.common.services.exceptions import PushResultsFailureException

_MAX_RETRIES = 5

# TODO: Update if POST data format changes, or simply remove this comment once solidifed.
def push_results_to_response_url(job_output: GradingJobResult, key: str, response_url: str):
  result_as_json = job_output.to_json()
  result_as_json["key"] = key
  return _send_results_with_exponential_backoff(result_as_json, response_url)

def _send_results_with_exponential_backoff(payload: dict, response_url: str, n: int = 1):
  try:
    res = requests.post(response_url, json=payload)
    res.raise_for_status()
    return res
  except HTTPError as e:
    print(e.strerror)
    if n == _MAX_RETRIES:
      # TODO: Should we re-enqueue job on raising this exception?
      raise PushResultsFailureException
    time.sleep(2**n + (random.randint(0, 1000) / 1000.0))
    return _send_results_with_exponential_backoff(payload, response_url, n + 1)

def push_results_with_exception(job_json_string: str, e: Exception):
  output = GradingJobResult([], [e])
  job_json = json.loads(job_json_string)
  key, response_url = job_json["key"], job_json["response_url"]
  return push_results_to_response_url(output, key, response_url)
