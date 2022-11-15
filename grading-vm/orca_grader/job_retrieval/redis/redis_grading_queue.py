from redis import Redis
from redis.lock import Lock
from orca_grader.job_retrieval.grading_job_retriever import GradingJobRetriever
from orca_grader.job_retrieval.redis.exceptions import FailedToConnectToRedisException, RedisJobRetrievalException

class RedisGradingJobRetriever(GradingJobRetriever):

  LOCK_TIMEOUT = 2
  GET_OR_POP_TIMEOUT = 10

  def __init__(self, redis_db_url: str) -> None:
    try:
      self.__redis_client: Redis = self.__get_redis_client(redis_db_url)
    except:
      raise FailedToConnectToRedisException(redis_db_url)
    
  def retrieve_grading_job(self) -> str:
    return self.__get_next_job_from_queue()

  def __get_next_job_from_queue(self) -> str:
    queue_lock = Lock(self.__redis_client, 'GradingQueueLock', timeout=self.LOCK_TIMEOUT)
    lock_acquired = False
    while not lock_acquired:
      lock_acquired = queue_lock.acquire()
      print(("Lock acquired" if lock_acquired else "Lock not acquired."))
    next_job_key = self.__get_next_job_key()
    grading_job = self.__get_next_job_with_key(next_job_key)
    queue_lock.release()
    return grading_job

  def __get_next_job_key(self) -> str:
    reservation_str = self.__redis_client.bzpopmin('Reservations')
    reservation_info = reservation_str.decode().split('.')
    if (reservation_info[0] == 'immediate'): 
      _, job_key = reservation_info
    else:
      collation_type, collation_id, nonce = reservation_info
      self.__redis_client.srem(f"Nonces.{collation_type}.{collation_id}")
      job_key = self.__redis_client.lpop(f"SubmitterInfo.{collation_type}.{collation_id}")
    return job_key


  def __get_next_job_with_key(self, job_key: str) -> str:
    grading_job_raw: bytes = self.__redis_client.getdel({job_key})
    stringified_grading_job = grading_job_raw.decode()
    return stringified_grading_job

  def __get_redis_client(self, redis_db_url: str) -> Redis:
    connection = Redis.from_url(redis_db_url)
    return connection
