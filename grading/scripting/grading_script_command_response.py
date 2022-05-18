class GradingScriptCommandResponse:
  """
  Response from the execution of a command when running a grading script. 
  Users can query if the response was an error, the output from the command,
  the next place to go (i.e., next command | \"output\" | \"abort\"), and the 
  original command that was executed.
  """

  def __init__(self, isError: bool, output: str, next: str, cmd: str) -> None:
    self.__isError = isError
    self.__output = output
    self.__next = next
    self.__cmd = cmd
  
  def isError() -> bool:
    pass