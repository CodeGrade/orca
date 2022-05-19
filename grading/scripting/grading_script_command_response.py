class GradingScriptCommandResponse:
  """
  Response from the execution of a command when running a grading script. 
  Users can query if the response was an error, the output from the command,
  the next place to go (i.e., next command | \"output\" | \"abort\"), and the 
  original command that was executed.

  Possibilities:
    - isError() == true && (next == "abort" || next == "<int>")
    - isError() == false && (next == "abort" || next == "<int>")
  """

  def __init__(self, isError: bool, output: str, next: str, cmd: str) -> None:
    self.__isError = isError
    self.__output = output
    self.__next = next
    self.__cmd = cmd
  
  def is_error(self) -> bool:
    return self.__isError
  
  def get_output(self) -> str:
    return self.__output
  
  def get_next(self) -> str:
    return self.__next
  
  def get_original_cmd(self) -> str:
    return self.__cmd