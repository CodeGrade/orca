from typing import Callable, List
import redis

def get_redis_client(db_url: str) -> redis.Redis:
  return redis.from_url(db_url, decode_responses=True)

RollbackStep = Callable[[], None]

class RedisRollbackExecutor:

  def __init__(self, rollback_steps: List[Callable[[List[RollbackStep]], None]]) -> None:
    self.rollback_steps = rollback_steps

  def execute(self):
    for step in self.rollback_steps:
      step()

class RedisRollbackBuilder:
  
  def __init__(self, client: redis.Redis) -> None:
    self._client = client
    self._rollback_steps: List[RollbackStep] = []

  def build(self) -> RedisRollbackExecutor:
    self._rollback_steps.reverse()
    return RedisRollbackExecutor(self._rollback_steps)