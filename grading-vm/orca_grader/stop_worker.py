import json
import signal
import pathlib
import os
import threading
import time
import redis

from orca_grader.common.types.grading_job_json_types import GradingJobJSON


_EVENT = threading.Event()

class GracefulKiller:
  """
  Idea pulled from https://stackoverflow.com/questions/18499497/how-to-process-sigterm-signal-gracefully.
  """
  
  def __init__(self) -> None:
    signal.signal(signal.SIGINT, self.exit_gracefully)
    signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self):
    _EVENT.set()
  
  def wait_for_stop_signal(self):
    _EVENT.wait()


def reenqueue_job(grading_job_json: GradingJobJSON, client: redis.Redis) -> None:
  if not client.exists(grading_job_json['key']):
    client.set(grading_job_json['key'], json.dumps(grading_job_json))
  arrival_time = time.time_ns()
  client.zadd('Reservations',
              {f'immediate.{grading_job_json["key"]}': 
               arrival_time + grading_job_json['priority']})
