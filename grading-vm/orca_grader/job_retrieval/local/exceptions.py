from orca_grader.job_retrieval.exceptions import JobRetrievalException

class LocalGradingJobRetrievalError(JobRetrievalException):

  def __init__(self, msg: str) -> None:
    super().__init__(msg)
