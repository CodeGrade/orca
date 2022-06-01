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

  def __init__(self) -> None:
      self.__grading_job = None

  def create_grading_job(self, submission_id: int, grade_id: int, student_code: str, grading_script: GradingScript) -> None:
    """
    Creates a GradingJob instance contained by this builder. Takes in the parameters deemed necessary by the GradingJob 
    constructor.
    """
    self.__grading_job = GradingJob(grade_id, submission_id, student_code, grading_script)
  
  def add_max_retries(self, max_retries: int):
    self.__grading_job.set_script_max_retries(max_retries)
  
  def add_starter_code(self, starter_code: str):
    self.__grading_job.set_starter_code(starter_code)

  def add_professor_code(self, professor_code: str):
    self.__grading_job.set_professor_code(professor_code)

  def get_grading_job(self) -> GradingJob:
    return self.__grading_job