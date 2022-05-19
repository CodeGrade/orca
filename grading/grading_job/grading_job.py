from typing import List
from grading.grading_script.grading_script_command import GradingScriptCommand
from grading_script.grading_script import GradingScript

DEFAULT_NUM_RETRIES = 2

class GradingJob:
  """
  Data class containing all data necessary to execute a grading job.

  MUST Include:
    - A grading script (i.e., list of commands to execute).
    - URL to student code, being either a single code file (e.g., example.java) or a .zip file.
    - Grade ID
    - Submission ID

  MIGHT Include:
    - Starter code (i.e., single code file or .zip file).
    - Professor code (i.e., test contained in single file or .zip file).
    - Max No. Retries allowed during execution. Default is two retries.
  """

  def __init__(self, grade_id: str, sub_id: str, student_code: str, 
    grading_script: List[dict], starter_code: str = None, professor_code: str = None, 
    max_retries: int = DEFAULT_NUM_RETRIES) -> None:
      self.__grade_id = grade_id
      self.__sub_id = sub_id
      self.__student_code = student_code
      self.__starter_code = starter_code
      self.__professor_code = professor_code
      self.__grading_script: GradingScript = \
        GradingJob.generate_grading_script(grading_script, max_retries)

  @staticmethod
  def generate_grading_script(commands: List[dict], max_retries: int):
    """
    Given a list of grading script commands, generate a grading script
    that can take these commands and execute them.
    """
    def cmd_json_to_class(cmd: dict):
      return GradingScriptCommand(cmd['cmd'], cmd['on_complete'], cmd['on_fail'])
    gs_cmd_objs = map(cmd_json_to_class, commands)
    return GradingScript(gs_cmd_objs, max_retries)