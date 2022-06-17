class InvalidFilePathException(Exception):
  """
  Exception thrown when the given file path for a code file or archive of code
  files is invalid.

  Example: A file path has no file extension, and thus how to retrieve it is 
  unknown to the program.
  """

  def __init__(self, msg: str) -> None:
    super().__init__(msg)