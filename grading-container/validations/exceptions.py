class InvalidGradingJobJSONException(Exception):

  def __init__(self, msg: str = "The given JSON does not match the schema for a valid GradingJob OR is not a valid JSON.") -> None:
    super().__init__(msg)