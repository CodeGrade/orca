import redis

def get_redis_client(db_url: str) -> redis.Redis:
  return redis.from_url(db_url, decode_responses=True)