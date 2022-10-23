DEFAULT_MSG = "The given JSON does not match the schema for a valid GradingJob OR is not a valid JSON."

class InvalidGradingJobJSONException(Exception):

  def __init__(self, msg: str = DEFAULT_MSG) -> None:
    super().__init__(msg)
