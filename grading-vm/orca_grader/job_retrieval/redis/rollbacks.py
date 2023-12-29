from typing import Callable, List, Optional
from orca_grader.redis_utils import RedisRollbackBuilder, RedisRollbackExecutor


class JobRetrievalRollbackBuilder(RedisRollbackBuilder):

  def add_reservation_rollback_step(self, reservation_str: str, timestamp: int):
    self._rollback_steps.append(lambda: self._client.zadd('Reservations', { reservation_str: timestamp }))
    return self

  def add_nonce_rollback_step(self, collation_type: str, collation_id: str, nonce: str):
    self._rollback_steps.append(
      lambda: self._client.sadd(f'Nonces.{collation_type}.{collation_id}', nonce)
    )
    return self

  def add_submitter_info_rollback_step(self, collation_type: str, collation_id: str, job_key: str):
    self._rollback_steps.append(lambda: self._client.lpush(f"SubmitterInfo.{collation_type}.{collation_id}", job_key))
    return self
