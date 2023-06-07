from typing import Optional
import redis

def get_current_number_of_reservations(client: redis.Redis) -> int:
  return client.zcard('Reservations')