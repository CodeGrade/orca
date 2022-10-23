from redis import Redis
from redis.lock import Lock
from grading_job.job_retrieval.grading_job_retriever import GradingJobRetriever
from grading_job.job_retrieval.redis.exceptions import FailedToConnectToRedisException, RedisJobRetrievalException

class RedisGradingJobRetriever(GradingJobRetriever):

  LOCK_TIMEOUT = 2
  GET_OR_POP_TIMEOUT = 10

  def __init__(self, redis_db_url: str) -> None:
    try:
      self.__redis_client: Redis = self.__get_redis_client(redis_db_url)
    except:
      raise FailedToConnectToRedisException(redis_db_url)
    
  def retrieve_grading_job(self):
    return self.__get_next_job_from_queue()

  def __get_next_job_from_queue(self):
    queue_lock = Lock(self.__redis_client, 'GradingQueueLock', timeout=self.LOCK_TIMEOUT)
    lock_acquired = False
    while not lock_acquired:
      lock_acquired = queue_lock.acquire()
      print(("Lock acquired" if lock_acquired else "Lock not acquired."))
    next_sub_id = self.__get_next_job_sub_id()
    grading_job = self.__get_next_job_with_sub_id(next_sub_id)
    queue_lock.release()
    return grading_job

  def __get_next_job_sub_id(self) -> str:
    _, sub_info_raw, _ = self.__redis_client.bzpopmin('GradingQueue')
    sub_info = sub_info_raw.decode().split('.')
    id_type, id, _ = sub_info
    if id_type == "sub":
      sub_id = id
    else:
      sub_id_raw = self.__redis_client.lpop(f"SubmitterInfo.{id_type}.{id}")
      sub_id = sub_id_raw.decode()
    return sub_id

  def __get_next_job_with_sub_id(self, sub_id: str) -> str:
    grading_job_raw: bytes = self.__redis_client.get(f"QueuedGradingInfo.{sub_id}")
    stringified_grading_job = grading_job_raw.decode()
    return stringified_grading_job

  def __get_redis_client(self, redis_db_url: str) -> Redis:
    connection = Redis.from_url(redis_db_url)
    return connection
