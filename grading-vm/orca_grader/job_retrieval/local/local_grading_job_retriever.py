from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.local.exceptions import LocalGradingJobRetrievalError

class LocalGradingJobRetriever(GradingJobRetriever):

  def __init__(self, grading_job_config_path: str) -> None:
    self.__grading_job_config_path = grading_job_config_path
    super().__init__()
    
  def retrieve_grading_job(self) -> str:
    try:
      with open(self.__grading_job_config_path, 'r') as json_file:
        return json_file.read()
    except FileNotFoundError:
      raise LocalGradingJobRetrievalError("The given file path did not point to a grading job.")
    except IOError:
      raise LocalGradingJobRetrievalError("An error occurred while trying to read from ")
    
