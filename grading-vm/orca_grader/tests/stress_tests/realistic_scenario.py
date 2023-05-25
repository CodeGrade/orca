import datetime
import json
import copy
import time
from typing import Dict, List, Union

import redis
from orca_grader import get_redis_client
from orca_grader.config import APP_CONFIG

from orca_grader.tests.scripts.seed_test_db import add_job_to_queue

SubmissionMetadatum = Dict[str, Union[int, str, None]]

__FORMATTABLE_JOB_JSON_PATH = 'orca_grader/tests/fixtures/grading_job/formattable/realistic-scenario.json'
__METADATA_JSON_PATH = 'orca_grader/tests/stress_tests/metadata.json'
__FAST_FORWARD_WAIT_TIME = 10

def run_scenario():
  submission_data = []
  with open(__METADATA_JSON_PATH) as metadata_fp:
    submission_data = process_submissions_from_metadata(
      list(json.load(metadata_fp).values())
      )
  adjust_sub_timestamps(submission_data)
  current_job_key = -1
  time_offset = 0
  while len(submission_data) > 0:
    current_sub_data = submission_data.pop(0)
    current_job_key += 1
    current_time = time.time_ns() + time_offset
    while current_sub_data['submitted'] > current_time:
      queue_length = get_queue_length()
      if queue_length == 0:
        # TODO: Add debug message to signify that queue is empty
        time_offset = current_sub_data['submitted'] - time.time_ns()
        break
      time.sleep(min(__FAST_FORWARD_WAIT_TIME, current_sub_data['submitted'] - current_time))
      current_time = time.time_ns()
    enqueue_job(current_sub_data, str(current_job_key), get_redis_client(APP_CONFIG.redis_db_url))
      
def adjust_sub_timestamps(metadata: List[SubmissionMetadatum]):
  """
  Adjust everything in the given metadata to start Now.
  """
  if len(metadata) == 0:
    return
  # TODO: Convert all to ns timestamp
  timestamps = list(map(lambda m: datetime.datetime.fromisoformat(m['submitted']), metadata))
  timestamp_then = timestamps[0]
  timestamp_now = time.time_ns()
  offset = timestamp_now - timestamp_then
  for i in range(len(metadata)):
    sub = metadata[i]
    sub["submitted"] = timestamps[i] + offset

def process_submissions_from_metadata(metadata: List[SubmissionMetadatum]):
  subs_by_user_id = get_subs_by_user_id(metadata)
  for _, subs in subs_by_user_id.items():
    for i in range(len(subs)):
      current_sub = subs[i]
      priority = calculate_priority(current_sub['submitted'],
                                    subs[:i-1] if i > 0 else [])
      current_sub["priority"] = priority
  subs = [sub for subs in list(subs_by_user_id.values()) for sub in subs]
  subs.sort(key=lambda s: datetime.datetime.fromisoformat(s["submitted"]))
  return subs

def get_subs_by_user_id(metadata: List[SubmissionMetadatum]) -> Dict[int, List[SubmissionMetadatum]]:
  submissions_by_user_id = dict()
  for metadatum in metadata:
    if metadatum["user_id"] not in submissions_by_user_id:
      submissions_by_user_id[metadatum['user_id']] = []
    copied_md = copy.copy(metadatum)
    copied_md["submitted"] = copied_md['submitted']
    submissions_by_user_id[metadatum['user_id']].append(metadatum)
  return submissions_by_user_id

def enqueue_job(sub_metadatum: SubmissionMetadatum, job_key: str, client: redis.Redis):
  with open(__FORMATTABLE_JOB_JSON_PATH) as formattable_job_fp:
    contents = formattable_job_fp.read()
    formattable_job = json.loads(contents.replace('$SUBMISSION_FILE_NAME', sub_metadatum["submission_path"]))
  formattable_job["key"] = job_key
  formattable_job["priority"] = sub_metadatum["priority"]
  formattable_job["collation"]["id"] = str(sub_metadatum["user_id"])
  add_job_to_queue(client, formattable_job)

def calculate_priority(current_timestamp: datetime.datetime,
                       previous_submissions: List[SubmissionMetadatum]) -> int:
  """
  Returns number of submissions in the last 15 mins * 1 min in nanoseconds.
  """
  previous_datetimes = list(map(lambda s: datetime.datetime.fromisoformat(s["submitted"]), 
                                previous_submissions))
  num_subs_in_last_15_mins = len(list(
    filter(lambda ts: datetime.datetime.fromisoformat(current_timestamp) \
           - ts <= datetime.timedelta(minutes=15),
           previous_datetimes)
           ))
  return secs_to_ns(60 * num_subs_in_last_15_mins)

def secs_to_ns(secs: int) -> int:
  return secs * 1_000_000_000

def ns_to_secs(ns: int) -> int:
  return ns / 1_000_000_000

def get_queue_length() -> int:
  return get_redis_client(APP_CONFIG.redis_db_url).zcard('Reservations')

if __name__ == "__main__":
  run_scenario()