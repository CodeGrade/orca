from typing import Optional
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.db.operations import get_next_job
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever


class PostgresGradingJobRetirever(GradingJobRetriever):

    def retrieve_grading_job(self) -> Optional[GradingJobJSON]:
        return get_next_job()
