from copy import deepcopy
import json
import time
import redis
from typing import Callable, List, Optional, Tuple
from orca_grader import get_redis_client
from orca_grader.config import APP_CONFIG
from orca_grader.tests.scripts.seed_test_db import add_job_to_queue

def enqueue_job_json_from_file(client: redis.Redis, json_path: str, mock_key: str, homework_index: int) -> None:
  with open(json_path, 'r') as json_fp:
    contents = json_fp.read()
    job_json = json.loads(contents.replace('$HOMEWORK_INDEX', str(homework_index)))
    job_json["key"] = mock_key
    add_job_to_queue(client, 
                     job_json)

def add_jobs_to_queue_at_interval(num_jobs: Optional[int] = None,
                                  interval: Optional[Tuple[int, int]] = None) -> None:
  with open('homework_index.json', 'r') as homework_index_fp:
    homework_indices = json.load(homework_index_fp)
  redis_client = get_redis_client(APP_CONFIG.redis_db_url)
  formattable_job_path ='orca_grader/tests/fixtures/grading_job/formattable/java-example.json'
  jobs_added = 0
  num_jobs = num_jobs or len(homework_indices)
  
  while jobs_added < num_jobs:
    copied_homework_indices = deepcopy(homework_indices)
    jobs_to_add, num_seconds = interval if interval else None, None
    if jobs_to_add is not None:
      for _ in range(jobs_to_add):
        enqueue_job_json_from_file(redis_client,
                                   formattable_job_path,
                                   str(jobs_added),
                                   copied_homework_indices.pop())
        if len(copied_homework_indices) == 0:
          copied_homework_indices = deepcopy(homework_indices)
        jobs_added += 1
        if num_seconds is not None:
          time.sleep(num_seconds)
    else:
      homework_index = copied_homework_indices.pop()
      enqueue_job_json_from_file(redis_client,
                                 formattable_job_path,
                                 str(jobs_added),
                                 homework_index)
      if len(copied_homework_indices) == 0:
          copied_homework_indices = deepcopy(homework_indices)
      jobs_added += 1