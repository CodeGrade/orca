import logging
import requests
from typing import Optional

_LOGGER = logging.getLogger(__name__)


def post_job_status_to_client(location: str, response_url: str,
                              key: str, id: Optional[int] = None) -> None:
    try:
        status = {"location": location}
        if id is not None:
            status["id"] = id
        requests.post(
            response_url,
            json={"key": key, "status": status}
        ).raise_for_status()
    except requests.HTTPError as http_e:
        _LOGGER.warning("Could not send job status update to client. "
                        f"Status Code: {http_e.response.status_code}.")
    except Exception as e:
        _LOGGER.warning(f"Encountered error when attempting to update job status with client: {e}")
