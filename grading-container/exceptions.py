class GradingJobProcessingException(Exception):
  """
  This exception is thrown when encountering an error during one of the following steps:
    - Reading in a grading job JSON from stdin.
    - Converting JSON into Python data types.
    - Converting the "pythonic JSON" into a GradingJob object.
  """

  def __init__(self, msg: str) -> None:
    super().__init__(msg)