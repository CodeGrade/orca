from grading_job.build_script.code_file_info import CodeFileInfo
from grading_job.grading_job import GradingJob
from grading_job.grading_script.grading_script import GradingScript

class GradingJobBuilder:
  """
  Builder for creating an instance of a GradingJob. GradingJob's at minimum
  require a path to student code, a grade and submission id, and 
  a script to run to grade the code.

  Other parameters (e.g., starter code, professor code, etc.) can be added through
  this builder class.
  """

  def __init__(self, submission_id: int, grade_id: int, target_code: CodeFileInfo, 
    grading_script: GradingScript) -> None:
      self.__grading_job = GradingJob(submission_id, grade_id, target_code, grading_script)
  
  def set_max_retries(self, max_retries: int):
    self.__grading_job.set_script_max_retries(max_retries)
  
  def set_fixture_code(self, fixture_code: CodeFileInfo):
    self.__grading_job.set_fixture_code(fixture_code)

  def set_professor_code(self, professor_code: CodeFileInfo):
    self.__grading_job.set_test_code(professor_code)

  def set_grading_job(self) -> GradingJob:
    return self.__grading_job