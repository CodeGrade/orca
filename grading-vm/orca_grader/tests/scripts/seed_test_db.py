import json
import sys
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from redis import Redis
import time

from orca_grader.config import APP_CONFIG
from orca_grader.queue_diagnostics import JobState, log_diagnostics

ONE_DAY = 60 * 60 * 24 # secs * mins * hours

def add_job_to_queue(client: Redis, job_json: GradingJobJSON) -> None:
  key, collation, priority = job_json["key"], job_json["collation"], job_json["priority"]
  nextTask = f'{collation["type"]}.{collation["id"]}'
  arrival_time = time.time_ns()
  nonce = priority + arrival_time
  with client.lock('GradingQueueLock'):
    client.rpush(f'SubmitterInfo.{nextTask}', key)
    client.zadd('Reservations', {f'{nextTask}.{arrival_time}': nonce})
    client.sadd(f'Nonces.{collation["type"]}.{collation["id"]}', nonce)
    client.set(key, json.dumps(job_json))
  # if APP_CONFIG.enable_diagnostics:
  #   log_diagnostics(client, arrival_time, key, JobState.CREATED)
  #   log_diagnostics(client, nonce, key, JobState.RELEASED)

if __name__ == "__main__":
  _, json_path = sys.argv
  with open(json_path, 'r') as json_fp:
    job_json = json.load(json_fp)
  client = Redis.from_url(APP_CONFIG.redis_db_url)
  add_job_to_queue(client, job_json, '1')
