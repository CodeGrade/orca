from typing import List

from grading_script.grading_script_command import GradingScriptCommand
from grading_script.grading_script_command_response import GradingScriptCommandResponse

DEFAULT_NUM_RETRIES = 2

# TODO: Add files for student code, starter code(?), professor code(?) (tests).
class GradingScript:  
  def __init__(self, cmds: List[GradingScriptCommand], max_retries: int = DEFAULT_NUM_RETRIES) -> None:
    self.__cmds: List[GradingScriptCommand] = cmds
    self.__num_retries = 0
    self.__max_retries = max_retries
    
  # TODO: Create new Output class to capture all information.
  # TODO: This should probably be a while loop where we can navigate 
  # back to a previous/future command (i.e., onComplete and onAbort logic)
  def execute_script(self) -> str:
    for cmd in self.__cmds:
      cmd_output: GradingScriptCommandResponse = cmd.exec_cmd()
      if cmd_output.is_error():
        print("ERROR: {0}".format(cmd_output.get_output()))
      else:
        print("OUTPUT: {0}".format(cmd_output.get_output()))
      if cmd_output.get_next() == "output":
        return cmd_output.get_output()