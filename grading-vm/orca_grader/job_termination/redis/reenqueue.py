import json
import redis
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.job_termination.redis.exceptions import ReenqueueJobException
from orca_grader.job_termination.redis.rollbacks import ReenqueueRollbackBuilder


def reenqueue_job(grading_job_json: GradingJobJSON,
                  original_timestamp: int,
                  client: redis.Redis) -> None:
  print('Reenqueuing job.')
  rollback_builder = ReenqueueRollbackBuilder(client)
  __set_job_key(client, grading_job_json['key'], json.dumps(grading_job_json), rollback_builder)
  __set_reservation(client, f'immediate.{grading_job_json["key"]}', original_timestamp, rollback_builder)
  
def __set_reservation(client: redis.Redis,
                      reservation_key: str,
                      reservation_score: int,
                      rollback_builder: ReenqueueRollbackBuilder) -> None:
  num_reservations_created = client.zadd('Reservations',
                                         {reservation_key: reservation_score})
  if num_reservations_created != 1:
    print("Failed to create reservation.")
    rollback_builder.build().execute()
    raise ReenqueueJobException(f'Failed to create a new reservation with member {reservation_key} when reenqueuing job.')

def __set_job_key(client: redis.Redis,
                  job_key: str,
                  job_string: str,
                  rollback_builder: ReenqueueRollbackBuilder) -> None:
  if client.exists(job_key):
    print("Job exists.")
    return
  set_key_result = client.set(job_key, job_string)
  if not set_key_result:
    print("Could not set job key.")
    rollback_builder.build().execute()
    raise ReenqueueJobException(f'Failed to re-set job under key {job_key}.')
  rollback_builder.add_job_key_step(job_key)