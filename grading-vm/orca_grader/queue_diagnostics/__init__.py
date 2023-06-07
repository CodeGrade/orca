import redis
from ._redis_utils import get_current_number_of_reservations
from ._job_state import JobState
from ._logging import QUEUE_DIAGNOSTIC_LOGGER

def log_diagnostics(client: redis.Redis, timestamp: int, job_key: str, job_state: JobState):
  while not QUEUE_DIAGNOSTIC_LOGGER.acquire_lock():
    continue
  try:
    QUEUE_DIAGNOSTIC_LOGGER.write_to_file(timestamp, 
                                          job_key, 
                                          job_state.value, 
                                          __get_queue_length(client))
  finally:
    QUEUE_DIAGNOSTIC_LOGGER.release_lock()
  
def __get_queue_length(client: redis.Redis) -> int:
  with client.lock('GradingQueueLock'):
    return get_current_number_of_reservations(client)