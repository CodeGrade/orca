from typing import List

from grading.scripting.grading_script_command import GradingScriptCommand


# TODO: Add files for student code, starter code, professor code (tests).
class GradingScript:  
  def __init__(self, cmds: List[GradingScriptCommand]) -> None:
      self.cmds = cmds