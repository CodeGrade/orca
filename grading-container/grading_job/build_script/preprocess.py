from typing import List

from grading_job.build_script.code_file.code_file_info import CodeFileInfo
from grading_job.grading_script.grading_script_command import GradingScriptCommand

class GradingScriptPreprocessor:

  def __init__(self, secret: str, max_retries: int) -> None:
    self.__interpolated_dirs = {
      "$ASSETS": "/assets",
      "EXTRACTED": f"{secret}_extracted",
      "BUILD": f"{secret}_build"
    }
    self.__max_retries = max_retries
    
  def process_job(self, grading_job):
    """
    """
    pass

  def __download_and_process_code_files(self, code_files: List[CodeFileInfo]):
    """
    Given a list of CodeFileInfo objects, download and extract (if necessary) each one.
    """
    pass

  def __generate_grading_script(self, commands: List[GradingScriptCommand]):
    """
    """
    pass

  def __get_grading_command_by_index(self, commands: List[GradingScriptCommand]):
    """
    """
    pass