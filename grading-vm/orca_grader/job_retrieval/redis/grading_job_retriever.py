import time
from redis import Redis
from redis.lock import Lock
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.redis.exceptions import FailedToConnectToRedisException, RedisJobRetrievalException

class RedisGradingJobRetriever(GradingJobRetriever):

  GET_OR_POP_TIMEOUT = 10
  JOB_WAIT_TIME = 2

  def __init__(self, redis_db_url: str) -> None:
    try:
      self.__redis_client: Redis = self.__get_redis_client(redis_db_url)
    except:
      raise FailedToConnectToRedisException(redis_db_url)
    
  def retrieve_grading_job(self) -> str:
    return self.__get_next_job_from_queue()

  def __waiting_on_jobs(self) -> bool:
    return self.__redis_client.zcard('Reservations') == 0

  def __get_next_job_from_queue(self) -> str:
    wait_initialized = False
    while True:
      with self.__redis_client.lock('GradingQueueLock'):
        if self.__waiting_on_jobs():
          if not wait_initialized:
            print("Waiting on jobs...")
            wait_initialized = True
          continue
        next_job_key = self.__get_next_job_key()
        grading_job = self.__get_next_job_with_key(next_job_key)
        return grading_job

  def __get_next_job_key(self) -> str:
    reservation_str, _ = self.__redis_client.zpopmin('Reservations')[0]
    reservation_info = reservation_str.split('.')
    if (reservation_info[0] == 'immediate'): 
      _, job_key = reservation_info
    else:
      collation_type, collation_id, nonce = reservation_info
      self.__redis_client.srem(f"Nonces.{collation_type}.{collation_id}", nonce)
      job_key = self.__redis_client.lpop(f"SubmitterInfo.{collation_type}.{collation_id}")
    return job_key

  def __get_next_job_with_key(self, job_key: str) -> str:
    return self.__redis_client.getdel(job_key)

  def __get_redis_client(self, redis_db_url: str) -> Redis:
    connection = Redis.from_url(redis_db_url, decode_responses=True)
    return connection
