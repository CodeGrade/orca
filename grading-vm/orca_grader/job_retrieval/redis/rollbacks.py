from typing import Callable, List, Optional
import redis


RollbackStep = Callable[[], None]


class RedisRollbackExecutor:

  def __init__(self, rollback_steps: List[Callable[[List[RollbackStep]], None]]) -> None:
    self.rollback_steps = rollback_steps

  def execute(self):
    for step in self.rollback_steps:
      step()


class RedisRollbackBuilder:

  def __init__(self, client: redis.Redis) -> None:
    self.client = client
    self.rollback_steps = []

  def build(self) -> RedisRollbackExecutor:
    return RedisRollbackExecutor(self.rollback_steps)

  def add_reservation_rollback_step(self, reservation_str: str, timestamp: int):
    self.rollback_steps.append(lambda: self.client.zadd('Reservations', { reservation_str: timestamp }))
    return self

  def add_nonce_rollback_step(self, collation_type: str, collation_id: str, nonce: str):
    self.rollback_steps.append(
      lambda: self.client.sadd(f'Nonces.{collation_type}.{collation_id}', nonce)
    )
    return self

  def add_submitter_info_rollback_step(self, collation_type: str, collation_id: str, job_key: str):
    self.rollback_steps.append(lambda: self.client.lpush(f"SubmitterInfo.{collation_type}.{collation_id}", job_key))
    return self
