class InvalidOnFailException(Exception):
  """
  This exception is thrown when the given string for on_fail in a Grading Job is not
  one of "abort" or "<Pos>".
  """

  def __init__(self, msg: str) -> None:
      super().__init__(msg)

class InvalidOnCompleteException(Exception):
  """
  This exception is thrown when the given string for on_fail in a Grading Job is not
  one of "output" or "<Pos>".
  """

  def __init__(self, msg: str) -> None:
      super().__init__(msg)