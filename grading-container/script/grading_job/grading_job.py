from tracemalloc import start
from typing import List
from grading_job.build_script.code_files import CodeFiles
from grading_job.build_script.retrieve_file_command_factory import RetrieveFileCommandFactory
from grading_job.build_script.retrieve_file_commands import FileRetrievalCommand
from grading_job.grading_job_output import GradingJobOutput
from audit import Audit
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

  def __init__(self, submission_id: int, grade_id: int, student_code: str, grading_script: GradingScript) -> None:
      self.__grade_id: int = grade_id
      self.__submission_id: int = submission_id
      self.__student_code: str = student_code
      self.__grading_script: GradingScript = grading_script
      self.__starter_code: str = None
      self.__professor_code: str = None
      self.__interpolated_dirs: dict[str, str] = { "$ASSETS": "/assets" }

  def execute_grading_job(self, secret: str, audit: Audit) -> GradingJobOutput:
    """
    Executes a grading job in full with the following workflow:
      1.) Download student, as well as Possibly starter and professor code.
      2.) Execute this object's GradingScript
      3.) Return the results in a GradingJobOutput object.
    """
    audit.log_details(f"Executing grading job with grade_id {self.__grade_id} "\
      "and submission_id {self.__submission_id}...")
    build_dir = f"{secret}_build"
    self.__interpolated_dirs["$BUILD"] = build_dir
    self.retrieve_job_files()
    # TODO: Replace with actual object.
    output: GradingJobOutput = None
    if output.has_tap_output():
      audit.log_details("Successfully completed running the grading script.")
    else: 
      audit.log_details("Script exeuction was aborted due to a number of errors.")
    audit.log_details("Grading job complete.")
    output.set_audit_log(audit.get_complete_log())
    return output

  def retrieve_job_files(self, retrieval_cmd_factory: RetrieveFileCommandFactory, 
    audit: Audit, secret: str) -> None:
    """
    Retrieves the code files necessary to run this GradingJob. This method has many side effects, 
    including the following:
      - Downloading either individual code files (e.g., code.java) or .zip files.
      - Placing files (i.e., extraction in case of .zip) into specific directories.
      - Updating the interpolated directories dictionary.
    """
    audit.log_details(f"Retrieving student files from {self.__student_code}...")
    student_rfc = retrieval_cmd_factory.generate_retrieval_command(CodeFiles.student_code, 
      self.__student_code, secret)
    student_rfc.execute()
    self.__interpolated_dirs["$STUDENT"] = student_rfc.get_save_dir_path()
    audit.log_details("Successfully retrieved student file(s).")
    # Both of these must exist. Starter code will generally not be available, 
    # and is even moreso pointless if tests do not exist as well.
    if self.__starter_code and self.__professor_code:
      # Retrieve Starter Code
      audit.log_details(f"Retrieving starter code from {self.__starter_code}")
      starter_rfc = retrieval_cmd_factory.generate_retrieval_command(CodeFiles.starter_code, 
        self.__starter_code, secret)
      starter_rfc.execute()
      self.__interpolated_dirs["$STARTER"] = starter_rfc.get_save_dir_path()
      audit.log_details("Successfully retrieved starter code.")
      # Retrieve Professor Code/Tests
      audit.log_details(f"Retrieving professor tests/code from {self.__professor_code}")
      professor_rfc = retrieval_cmd_factory.generate_retrieval_command(CodeFiles.professor_code, 
        self.__professor_code, secret)
      professor_rfc.execute()
      self.__interpolated_dirs["$PROFESSOR"] = professor_rfc.get_save_dir_path()
      audit.log_details("Successfully retrieved professor tests/code.")
    
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
  
  def get_grade_id(self) -> int:
    return self.__grade_id
  
  def get_submission_id(self) -> int:
    return self.__submission_id

  def get_student_code(self) -> str:
    return self.__student_code

  def get_grading_script(self) -> GradingScript:
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
