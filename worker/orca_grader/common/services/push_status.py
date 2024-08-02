import requests
from typing import Optional


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
        print(http_e)
        print(f"{http_e.request.body}, {http_e.request.headers}")
    except Exception as e:
        print(e)
