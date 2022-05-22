from typing import List
from validations.grading_job_json_types import GradingScriptCommandJSON
from grading_job.grading_script.grading_script import GradingScript
from grading_job.grading_script.grading_script_command import GradingScriptCommand

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

  def __init__(self, submission_id: str, grade_id: str, student_code: str, grading_script: GradingScript) -> None:
      self.__grade_id = grade_id
      self.__submission_id = submission_id
      self.__student_code = student_code
      self.__grading_script = grading_script

  @staticmethod
  def generate_grading_script(commands: List[GradingScriptCommandJSON], max_retries: int = DEFAULT_NUM_RETRIES):
    """
    Given a list of grading script commands, generate a grading script
    that can take these commands and execute them.
    """
    def cmd_json_to_class(cmd: GradingScriptCommandJSON) -> GradingScriptCommand:
      return GradingScriptCommand(cmd['cmd'], cmd['on_complete'], cmd['on_fail'])
    gs_cmd_objs = map(cmd_json_to_class, commands)
    return GradingScript(gs_cmd_objs, max_retries)
  
  def get_grade_id(self) -> str:
    return self.__grade_id
  
  def get_submission_id(self) -> str:
    return self.__submission_id

  def get_student_code(self) -> str:
    return self.__student_code

  def get_grading_script(self) -> str:
    return self.__grading_script

  def get_starter_code(self) -> str:
    return self.__starter_code

  def set_starter_code(self, starter_code: str) -> None:
    self.__starter_code = starter_code

  def get_professor_code(self) -> str:
    return self.__professor_code

  def set_professor_code(self, professor_code: str) -> None:
    self.__professor_code = professor_code

  def set_script_max_retries(self, max_retries: int) -> None:
    self.__grading_script.set_max_retries(max_retries)
