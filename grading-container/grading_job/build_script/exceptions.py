class PreprocessingException(Exception):
  """
  An abstract class for exceptions thrown during the preprocessing step
  of running a GradingJob.
  """
  
  def __init__(self, msg: str) -> None:
     super().__init__(msg)

class InvalidOnFailException(PreprocessingException):
  """
  This exception is thrown when:
    1.) Given string for on_fail in a GradingJob is not one of "abort" or "<number>".
    OR
    2.) The integer provided was out of bounds for the indices in the GradingScript.
  """

  def __init__(self, msg: str) -> None:
     super().__init__(msg)

class InvalidOnCompleteException(PreprocessingException):
  """
  This exception is thrown when:
    1.) Given string for on_fail in a GradingJob is not one of "output" or "<number>".
    OR
    2.) The integer provided was out of bounds for the indices in the GradingScript.
  """

  def __init__(self, msg: str) -> None:
    super().__init__(msg)

class NotADAGException(PreprocessingException):
  """
  This exception is thrown when, during the Preprocessing of a GradingScript (aka, the list of 
  GradingScriptCommands), it is discovered that the resulting directed graph will contain cycles.
  """

  def __init__(self, msg: str = "The given grading script forms a cyclic directed graph.") -> None:
    super().__init__(msg)

class InvalidGradingScriptCommand(PreprocessingException):

  def __init__(self, msg: str = "The given JSON does not match "\
    "the schema of a valid GradingScriptCommand.") -> None:
    super().__init__(msg)
