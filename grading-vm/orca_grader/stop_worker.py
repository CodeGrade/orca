import json
import signal
import pathlib
import os
import time
import redis

from orca_grader.common.types.grading_job_json_types import GradingJobJSON

KILL_JOB_FILE_NAME = '.killjob'
JOB_COMPLETED_FILE_NAME = '.jobcompleted'

class GracefulKiller:
  """
  Idea pulled from https://stackoverflow.com/questions/18499497/how-to-process-sigterm-signal-gracefully.
  """
  
  def __init__(self) -> None:
    self.kill_now = False
    signal.signal(signal.SIGINT, self.exit_gracefully)
    signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self, *args):
    pathlib.Path(KILL_JOB_FILE_NAME).touch()
    self.kill_now = True

class JobKillObserver:

  def __init__(self) -> None:
    self.__job_completed = False
    self.__kill_job = False

  def wait_for_jobkill_touch(self):
    while not self.__kill_job_sig_received() and not self.__job_completed_sig_received():
      continue

  def __kill_job_sig_received(self):
    self.__kill_job = os.path.exists(KILL_JOB_FILE_NAME)
    return self.__kill_job

  def __job_completed_sig_received(self):
    self.__job_completed = os.path.exists(JOB_COMPLETED_FILE_NAME)
    return self.__job_completed

def reenqueue_job(grading_job_json: GradingJobJSON, client: redis.Redis) -> None:
  if not client.exists(grading_job_json['key']):
    client.set(grading_job_json['key'], json.dumps(grading_job_json))
  arrival_time = time.time_ns()
  client.zadd('Reservations',
              {f'immediate.{grading_job_json["key"]}': 
               arrival_time + grading_job_json['priority']})
