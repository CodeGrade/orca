from typing import Optional
from orca_grader.common.types.grading_job_json_types import GradingJobJSON


class GradingJobRetriever():

    def retrieve_grading_job(self) -> Optional[GradingJobJSON]:
        raise NotImplementedError
