import json
from typing import Dict, List
import redis
from orca_grader import get_redis_client
from orca_grader.config import APP_CONFIG
from orca_grader.tests.scripts.seed_test_db import add_job_to_queue
from orca_grader.tests.stress_tests.realistic_scenario import SubmissionMetadatum


__FORMATTABLE_JOB_JSON_PATH = 'orca_grader/tests/fixtures/grading_job/formattable/realistic-scenario.json'

def enqueue_job(sub_metadatum: SubmissionMetadatum, job_key: str, client: redis.Redis):
  with open(__FORMATTABLE_JOB_JSON_PATH) as formattable_job_fp:
    contents = formattable_job_fp.read()
    formattable_job = json.loads(contents.replace('$SUBMISSION_FILE_NAME', sub_metadatum["submission_path"]))
  formattable_job["key"] = job_key
  formattable_job["priority"] = 0
  formattable_job["collation"]["id"] = str(sub_metadatum["user_id"])
  formattable_job["response_url"] = "http://echo-server:9001/job-output"
  add_job_to_queue(client, formattable_job)

if __name__ == '__main__':
  submission_metadata = None
  with open('orca_grader/tests/stress_tests/metadata.json') as metadata_fp:
    submission_metadata = json.load(metadata_fp)
  for key, metadatum in submission_metadata.items():
    enqueue_job(metadatum, key, get_redis_client(APP_CONFIG.redis_db_url))