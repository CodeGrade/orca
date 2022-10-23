from grading_job.job_retrieval.grading_job_retriever import GradingJobRetriever
from grading_job.job_retrieval.local.exceptions import LocalGradingJobRetrievalError
from validations.grading_job_json_types import GradingJobJSON
import json

class LocalGradingJobRetriever(GradingJobRetriever):

  def __init__(self, grading_job_config_path: str) -> None:
    self.__grading_job_config_path = grading_job_config_path
    super().__init__()
    
  def retrieve_grading_job(self) -> GradingJobJSON:
    try:
      with open(self.__grading_job_config_path, 'r') as json_file:
        grading_job_json = json.load(json_file)
        if GradingJobRetriever.is_valid_grading_job(grading_job_json):
          return grading_job_json
        else:
          raise LocalGradingJobRetrievalError("The given JSON in this file was not valid.")
    except FileNotFoundError:
      raise LocalGradingJobRetrievalError("The given file path did not point to a grading job.")
    except IOError:
      raise LocalGradingJobRetrievalError("An error occurred while trying to read from ")
    
