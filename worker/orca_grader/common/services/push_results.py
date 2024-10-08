import logging
import random
import time
import requests
from requests import HTTPError
from typing import Dict
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.common.services.exceptions import PushResultsFailureException
from orca_grader.common.types.grading_job_json_types import GradingJobJSON

_LOGGER = logging.getLogger(__name__)
_MAX_RETRIES = 5

# TODO: Update if POST data format changes, or simply remove this comment once solidifed.


def push_results_to_response_url(job_result: GradingJobResult,
                                 key: str,
                                 response_url: str,
                                 interpolated_dirs: Dict[str, str]) -> None:
    result_as_json = {
        **job_result.to_json(interpolated_dirs=interpolated_dirs),
        "key": key
    }
    _send_results_with_exponential_backoff(result_as_json, response_url)


def push_results_with_exception(grading_job: GradingJobJSON,
                                e: Exception) -> None:
    _LOGGER.debug(e)
    output = GradingJobResult([], [e])
    key, response_url = grading_job["key"], grading_job["response_url"]
    push_results_to_response_url(output, key, response_url, {})


def _send_results_with_exponential_backoff(payload: dict, response_url: str, n: int = 1):
    if n > 1:
        _LOGGER.debug("Attempting to retry sending job status. "
                      f"Retry attempt {n-1}.")
    try:
        res = requests.post(response_url, json=payload)
        res.raise_for_status()
        _LOGGER.debug(f"POSTed response to {response_url} with status code {res.status_code}")
        return res
    except HTTPError as e:
        if not _should_retry(e.response.status_code) or n == _MAX_RETRIES:
            _LOGGER.error(f"Could not send response to job client"
                          f"Status Code: {e.response.status_code}.")
            raise PushResultsFailureException
        time.sleep(2**n + (random.randint(0, 1000) / 1000.0))
        return _send_results_with_exponential_backoff(payload, response_url, n + 1)
    except Exception as e:
        _LOGGER.error(f"Encountered the following error pushing results: {e}")


def _should_retry(status_code: int) -> bool:
    return status_code in [503, 504]
