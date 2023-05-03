import json
import sys
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from redis import Redis
import redis.lock as redlock
import time

from orca_grader.config import APP_CONFIG

ONE_DAY = 60 * 60 * 24 # secs * mins * hours

def add_job_to_queue(client: Redis, job_json: GradingJobJSON, mock_key: str) -> None:
  key, collation, priority = mock_key, job_json["collation"], job_json["priority"]
  nextTask = f'{collation["type"]}.{collation["id"]}'
  arrival_time = int(time.time() * 1000) # convert time from secs -> ms
  nonce = priority + arrival_time
  print(arrival_time)
  print(nonce)
  queue_lock = redlock.Lock(client, 'GradingQueueLock')
  lock_acquired = False
  while not lock_acquired:
    lock_acquired = queue_lock.acquire()
  client.rpush(f'SubmitterInfo.{nextTask}', key)
  client.zadd('Reservations', {f'{nextTask}.{arrival_time}': nonce})
  client.sadd(f'Nonces.{collation["type"]}.{collation["id"]}', nonce)
  client.set(mock_key, json.dumps(job_json))
  queue_lock.release()

if __name__ == "__main__":
  _, json_path = sys.argv
  with open(json_path, 'r') as json_fp:
    job_json = json.load(json_fp)
  client = Redis.from_url(APP_CONFIG.redis_db_url)
  add_job_to_queue(client, job_json, '1')
