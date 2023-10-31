

from orca_grader.redis_utils import RedisRollbackBuilder


class ReenqueueRollbackBuilder(RedisRollbackBuilder):

  def add_job_key_step(self, job_key: str):
    self._client.delete(job_key)
    return self
