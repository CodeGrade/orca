import requests
from typing import Optional


def post_job_status_to_client(location: str, response_url: str,
                              key: str, id: Optional[int] = None) -> None:
    try:
        status = {"location": location}
        if id is not None:
            status["id"] = id
        requests.post(response_url, json=status)
    except Exception as e:
        print(e)
