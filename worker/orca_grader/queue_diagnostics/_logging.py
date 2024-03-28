import os
import os.path
import time
from typing import Optional
from orca_grader.queue_diagnostics import JobState


class _QueueDiagnosticLogger:
  """
  Diagnostics contain information about when a job has been enqueued, when a job's release time has
  been hit, when a job is dequeued, and when a job is completed. This class outputs this informaition
  to a CSV file for data analytics.
  """

  def __init__(self, file_name: str, ouptut_dir: Optional[str] = None) -> None:
    if ouptut_dir:
      os.makedirs(ouptut_dir, exist_ok=True)
    self.__file_path = os.path.join(ouptut_dir, file_name) if ouptut_dir \
      else file_name
    self.__is_locked = False
    self.__has_been_initialized = False

  def write_to_file(self, timestamp: int, 
                    job_key: str, 
                    job_state: JobState, 
                    queue_len: int) -> None:
    data = [str(v) for v in [timestamp, job_key, job_state, queue_len]]
    with open(self.__file_path, mode='a', newline='\n') as diagnostics_fp:
      if not self.__has_been_initialized:
        diagnostics_fp.write(','.join(['Timestamp', 'Job Key', 'Job State', 'Queue Length']) + '\n')
        self.__has_been_initialized = True
      diagnostics_fp.write(','.join(data) + '\n')
  
  def acquire_lock(self) -> bool:
    while self.__is_locked:
      continue
    self.__is_locked = True
    return self.__is_locked
  
  def release_lock(self) -> None:
    self.__is_locked = False

QUEUE_DIAGNOSTIC_LOGGER = _QueueDiagnosticLogger(f'diagnostics_{time.time_ns()}.csv', 'diagnostics')