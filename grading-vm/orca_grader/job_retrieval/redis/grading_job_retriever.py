import time
from typing import Tuple
from redis import Redis
from orca_grader.config import APP_CONFIG
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.redis.exceptions import FailedToConnectToRedisException, RedisJobRetrievalException
from orca_grader.queue_diagnostics import JobState, log_diagnostics
from orca_grader import get_redis_client

class RedisGradingJobRetriever(GradingJobRetriever):

  GET_OR_POP_TIMEOUT = 10
  JOB_WAIT_TIME = 2

  def __init__(self, redis_db_url: str) -> None:
    try:
      self.__redis_client: Redis = get_redis_client(redis_db_url)
    except:
      raise FailedToConnectToRedisException(redis_db_url)

  def retrieve_grading_job(self) -> Tuple[str, int]:
    return self.__get_next_job_and_timestamp_from_queue()

  def __waiting_on_jobs(self) -> bool:
    return self.__redis_client.zcard('Reservations') == 0

  def __get_next_job_and_timestamp_from_queue(self) -> Tuple[str, int]:
    wait_initialized = False
    while True:
      with self.__redis_client.lock('GradingQueueLock', timeout=2):
        if self.__waiting_on_jobs():
          if not wait_initialized:
            print("Waiting on jobs...")
            wait_initialized = True
          continue
        next_job_key, timestamp = self.__get_next_key_and_timestamp()
        grading_job = self.__get_next_job_with_key(next_job_key)
      self.__log_diagnostics(next_job_key)
      return grading_job, timestamp
      
  def __log_diagnostics(self, job_key: str) -> None:
    if not APP_CONFIG.enable_diagnostics:
      return
    dequeued_time = time.time_ns()
    state = JobState.DEQUEUED
    log_diagnostics(self.__redis_client, dequeued_time, job_key, state)

  def __get_next_key_and_timestamp(self) -> Tuple[str, int]:
    reservation_str, timestamp = self.__redis_client.zpopmin('Reservations')[0]
    print(reservation_str)
    reservation_info = reservation_str.split('.')
    if (reservation_info[0] == 'immediate'): 
      _, job_key = reservation_info
    else:
      collation_type, collation_id, nonce = reservation_info
      self.__redis_client.srem(f"Nonces.{collation_type}.{collation_id}", nonce)
      job_key = self.__redis_client.lpop(f"SubmitterInfo.{collation_type}.{collation_id}")
    return job_key, timestamp

  def __get_next_job_with_key(self, job_key: str) -> str:
    return self.__redis_client.getdel(job_key)
