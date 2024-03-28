from orca_grader.job_retrieval.exceptions import JobRetrievalException

class FailedToConnectToRedisException(JobRetrievalException):

  def __init__(self, url: str) -> None:
    msg = f"Failed to connect to Redis through URL {url}"
    super().__init__(msg)

class RedisJobRetrievalException(JobRetrievalException):

  def __init__(self, msg: str) -> None:
    super().__init__(msg)
