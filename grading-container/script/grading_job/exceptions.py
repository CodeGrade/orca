class InvalidOnFailException(Exception):
  """
  This exception is thrown when:
    1.) Given string for on_fail in a GradingJob is not one of "abort" or "<number>".
    OR
    2.) The integer provided was out of bounds for the indices in the GradingScript.
  """

  def __init__(self, msg: str) -> None:
      super().__init__(msg)

class InvalidOnCompleteException(Exception):
  """
  This exception is thrown when:
    1.) Given string for on_fail in a GradingJob is not one of "output" or "<number>".
    OR
    2.) The integer provided was out of bounds for the indices in the GradingScript.
  """

  def __init__(self, msg: str) -> None:
      super().__init__(msg)