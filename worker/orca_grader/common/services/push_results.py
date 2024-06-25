import random
import time
import requests
from requests import HTTPError
from typing import Dict, Optional
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.common.services.exceptions import PushResultsFailureException
from orca_grader.common.types.grading_job_json_types import GradingJobJSON

_MAX_RETRIES = 5

# TODO: Update if POST data format changes, or simply remove this comment once solidifed.


def push_results_to_response_url(job_result: GradingJobResult,
                                 key: str,
                                 response_url: str,
                                 interpolated_dirs: Optional[Dict[str, str]]) -> None:
    result_as_json = job_result.to_json(interpolated_dirs=interpolated_dirs)
    result_as_json["key"] = key
    _send_results_with_exponential_backoff(result_as_json, response_url)


def push_results_with_exception(grading_job: GradingJobJSON,
                                e: Exception) -> None:
    output = GradingJobResult([], [e]).to_json()
    key, response_url = grading_job["key"], grading_job["response_url"]
    push_results_to_response_url(output, key, response_url)


def _send_results_with_exponential_backoff(payload: dict, response_url: str, n: int = 1):
    try:
        res = requests.post(response_url, json=payload)
        res.raise_for_status()
        return res
    except HTTPError as e:
        print(e)
        if n == _MAX_RETRIES:
            # TODO: Should we re-enqueue job on raising this exception?
            raise PushResultsFailureException
        time.sleep(2**n + (random.randint(0, 1000) / 1000.0))
        return _send_results_with_exponential_backoff(payload, response_url, n + 1)
