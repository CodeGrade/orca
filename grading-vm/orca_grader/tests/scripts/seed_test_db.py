from redis import Redis
import json
import time
import sys
import os

ONE_DAY = 60 * 60 * 24 # secs * mins * hours

def add_job_to_queue(client: Redis, job_json) -> None:
  adjusted_priority = time.time() + job_json["priority"]
  submission_id: str = job_json["submission_id"]
  lifetime: int = max(int(adjusted_priority + ONE_DAY), client.ttl(f"QueuedGradingInfo.{submission_id}"))
  client.set(f"QueuedGradingInfo.{submission_id}", json.dumps(job_json), ex=lifetime)
  client.zadd(f"GradingQueue", {f"sub.{submission_id}": adjusted_priority})

def populate_db_with_job(client: Redis, job_json_path: str) -> None:
  with open(job_json_path, 'r') as fp:
    job_json = json.load(fp)
    add_job_to_queue(client, job_json)

if __name__ == "__main__":
  if len(sys.argv) != 2:
    sys.stderr.write("ERROR: User must provide a file path to a grading job "\
      "JSON example and nothing more.")
  job_path = sys.argv[1] # First argument is the module name
  redis_url_from_env = os.environ.get("REDIS_URL")
  print(redis_url_from_env)
  redis_instance_url = redis_url_from_env if redis_url_from_env is not None else "redis://localhost:6379"
  client = Redis.from_url(redis_instance_url)
  populate_db_with_job(client, job_path)


