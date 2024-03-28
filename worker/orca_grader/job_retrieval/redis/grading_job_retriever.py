import time
from typing import Tuple
from redis import Redis
from orca_grader.config import APP_CONFIG
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.redis.exceptions import FailedToConnectToRedisException, RedisJobRetrievalException
from orca_grader.job_retrieval.redis.rollbacks import JobRetrievalRollbackBuilder
from orca_grader.queue_diagnostics import JobState, log_diagnostics
from orca_grader.redis_utils import get_redis_client

class RedisGradingJobRetriever(GradingJobRetriever):

  GET_OR_POP_TIMEOUT = 10
  JOB_WAIT_TIME = 2

  def __init__(self, redis_db_url: str) -> None:
    try:
      client = get_redis_client(redis_db_url)
      self.__redis_client = client
      self.__redis_rollback_builder = JobRetrievalRollbackBuilder(client)
    except:
      raise FailedToConnectToRedisException(redis_db_url)

  def retrieve_grading_job(self) -> Tuple[str, int]:
    return self.__get_next_job_and_timestamp_from_queue()

  def __waiting_on_jobs(self) -> bool:
    return self.__redis_client.zcard('Reservations') == 0

  def __get_next_job_and_timestamp_from_queue(self) -> Tuple[str, int]:
    print("Waiting on jobs...")
    while self.__waiting_on_jobs():
      continue
    with self.__redis_client.lock('GradingQueueLock', timeout=2):
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
    reservation_str, timestamp = self.__get_reservation_information()
    timestamp = int(timestamp)
    reservation_info = reservation_str.split('.')
    if (reservation_info[0] == 'immediate'): 
      _, job_key = reservation_info
    else:
      collation_type, collation_id, nonce = reservation_info
      self.__remove_nonce_for_collation(collation_type, collation_id, nonce)
      job_key = self.__get_job_key_from_collation(collation_type, collation_id)
    return job_key, timestamp
  
  def __get_job_key_from_collation(self, collation_type: str, collation_id: str) -> str:
    next_job_key = self.__redis_client.lpop(f"SubmitterInfo.{collation_type}.{collation_id}")
    if next_job_key == None:
      self.__rollback_retrieval()
      raise RedisJobRetrievalException(
        f"Failed to get a job key from the SubmitterInfo list for {collation_type}.{collation_id}"
        )
    self.__redis_rollback_builder.add_submitter_info_rollback_step(collation_type, collation_id, next_job_key)
    print(next_job_key)
    return next_job_key
  
  def __remove_nonce_for_collation(self, collation_type: str, collation_id: str, nonce: str) -> None:
    num_nonces_removed = self.__redis_client.srem(f"Nonces.{collation_type}.{collation_id}", str(nonce))
    if num_nonces_removed != 1:
      self.__rollback_retrieval()
      raise RedisJobRetrievalException(f"Failed to remove a nonce for the collation {collation_type}.{collation_id}")

  def __get_reservation_information(self) -> Tuple[str, int]:
    popped_values = self.__redis_client.zpopmin('Reservations')
    if len(popped_values) != 1:
      self.__rollback_retrieval()
      raise RedisJobRetrievalException("Unable to pop off a reservation from the Redis queue.")
    reservation_str, timestamp = popped_values[0]
    self.__redis_rollback_builder.add_reservation_rollback_step(reservation_str, timestamp)
    return reservation_str, timestamp
  
  def __rollback_retrieval(self) -> None:
    executor = self.__redis_rollback_builder.build()
    executor.execute()

  def __get_next_job_with_key(self, job_key: str) -> str:
    job_string = self.__redis_client.getdel(job_key)
    if job_string == None:
      self.__rollback_retrieval()
      raise RedisJobRetrievalException(f"Unable to retrieve a grading job with the given key {job_key}.")
    return job_string
