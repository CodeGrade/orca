from base64 import b64encode
import json
import sys
from redis import Redis
import time
import os
from copy import copy
from orca_grader.redis_utils import get_redis_client
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.config import APP_CONFIG

ONE_DAY = 60 * 60 * 24 # secs * mins * hours

__BASIC_GRADING_JOB_SCAFFOLDING = {
  'script': [
    {
      'cmd': ['echo', 'This is a basic command.']
    },
    {
      'cmd': ['echo', 'This is some output.'],
      'on_complete': 'output'
    }
  ],
  'grader_image_sha': 'orca-java-grader',
  'collation': {
    'type': 'user'
  },
  'response_url': 'http://localhost:9001/job-output',
  'container_response_url': 'http://echo-server:9001/job-output',
  'files': {},
  'metadata_table': {}
}

def add_job_to_queue(client: Redis, job_json: GradingJobJSON) -> None:
  key, collation, priority = job_json["key"], job_json["collation"], job_json["priority"]
  nextTask = f'{collation["type"]}.{collation["id"]}'
  arrival_time = int(time.time() * 10**6)
  nonce = priority + arrival_time
  with client.lock('GradingQueueLock'):
    client.rpush(f'SubmitterInfo.{nextTask}', key)
    client.zadd('Reservations', {f'{nextTask}.{arrival_time}': nonce})
    client.sadd(f'Nonces.{collation["type"]}.{collation["id"]}', nonce)
    client.set(key, json.dumps(job_json))
  # if APP_CONFIG.enable_diagnostics:
  #   log_diagnostics(client, arrival_time, key, JobState.CREATED)
  #   log_diagnostics(client, nonce, key, JobState.RELEASED)

if __name__ == '__main__':
  for i in range(50):
    job = copy(__BASIC_GRADING_JOB_SCAFFOLDING)
    job['key'] = str(i)
    job['collation']['id'] = str(i)
    job['priority'] = 0
    client = get_redis_client(APP_CONFIG.redis_db_url)
    add_job_to_queue(client, job)
