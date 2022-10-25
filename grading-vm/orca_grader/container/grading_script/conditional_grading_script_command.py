from enum import Enum
from types import FunctionType
from typing import List
from orca_grader.common.grading_job.grading_job_output import GradingJobOutput
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from os.path import exists, isdir, isfile
from orca_grader.container.grading_script.grading_script_command_response \
  import GradingScriptCommandResponse

class GradingScriptPredicate(Enum):
  EXISTS = "exists"
  FILE = "file"
  DIR = "dir"

def predicate_to_func(pred: GradingScriptPredicate) -> FunctionType:
  """
  Given a GradingScriptPredicate, returns the function needed to properly 
  apply the predicate to a file path.
  """
  cases = {
    GradingScriptPredicate.DIR: isdir,
    GradingScriptPredicate.FILE: isfile,
    GradingScriptPredicate.EXISTS: exists
  }
  return cases[pred]


class ConditionalGradingScriptCommand(GradingScriptCommand):
  """
  A GradingScriptCommand that runs some predicate, and points to the appropriate
  command if the evaluation is true/false. Currently supports checking against
  the filesystem.
  """
  pass

  def __init__(self, on_true: GradingScriptCommand, on_false: GradingScriptCommand, 
    file_path: str, predicate: GradingScriptPredicate) -> None:
    self.__on_true = on_true
    self.__on_false = on_false
    self.__file_path = file_path
    self.__predicate = predicate
  
  def execute(self, responses: List[GradingScriptCommandResponse]) -> GradingJobOutput:
    check = predicate_to_func(self.__predicate)
    if check(self.__file_path):
      return self.__on_true.execute(responses)
    else:
      return self.__on_false.execute(responses)
