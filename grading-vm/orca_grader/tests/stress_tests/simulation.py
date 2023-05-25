import datetime
from typing import Dict, List, Optional
from orca_grader.tests.stress_tests.realistic_scenario import SubmissionMetadatum
from orca_grader.queue_diagnostics import JobState

def run_simulation(metadata: Dict[str, SubmissionMetadatum], num_workers: int) -> Dict[int, Dict[JobState, int]]:
  workers = [None for _ in range(num_workers)]
  simulatable_metadata = make_metadata_simulatable(list(metadata.values()))
  job_log = { k: dict() for k in list(metadata.keys()) }
  for metadatum in simulatable_metadata:
    created_at_timestamp = simulatable_metadata['submitted'].timestamp()
    released_at_timestamp = created_at_timestamp + simulatable_metadata['priority']
    job_log[metadatum['id']][JobState.CREATED] = created_at_timestamp
    job_log[metadatum['id']][JobState.RELEASED] = released_at_timestamp
    give_job_to_worker(metadatum, workers, job_log)
  return job_log

def give_job_to_worker(job: SubmissionMetadatum, 
                       workers: List[Optional[datetime.datetime]],
                       job_log: Dict[int, Dict[JobState, int]]) -> None:
  next_worker_to_finish = workers.pop(0)
  job_finished_at = calculate_job_finish_time(job, next_worker_to_finish)
  job_dequeued_at = job_finished_at - datetime.timedelta(job['duration'])
  job_log[job['id']][JobState.DEQUEUED] = job_dequeued_at.timestamp()
  job_log[job['id']][JobState.COMPLETED] = job_finished_at.timestamp()
  workers.append(job_finished_at)

def calculate_job_finish_time(job: SubmissionMetadatum, 
                              worker_finish_info: Optional[datetime.datetime]) -> datetime.datetime:
  base_job_completion_dt = job['submitted'] + datetime.timedelta(seconds=job['duration'])
  if worker_finish_info is None:
    return base_job_completion_dt
  secs_before_dequeue = (worker_finish_info - job['submitted']).total_seconds() \
    if worker_finish_info > job['submitted'] else 0
  return base_job_completion_dt + datetime.timedelta(seconds=secs_before_dequeue)

def make_metadata_simulatable(metadata: List[SubmissionMetadatum]) -> List[SubmissionMetadatum]:
  for metadatum in metadata:
    metadatum['submitted'] = datetime.datetime.fromisoformat(metadatum['submitted'])
  metadata_with_priorities = list(get_metadata_by_user_id(metadata).values())
  metadata_in_timestamp_order = [m for arr in metadata_with_priorities for m in arr]
  metadata_in_timestamp_order.sort(key=lambda m: m['submitted'])
  return metadata_in_timestamp_order

def get_metadata_by_user_id(metadata: List[SubmissionMetadatum]) -> Dict[int, List[SubmissionMetadatum]]:
  user_id_to_metadata = dict()
  for metadatum in metadata:
    if metadatum['user_id'] not in user_id_to_metadata:
      user_id_to_metadata[metadatum['user_id']] = []
    user_id_to_metadata[metadatum['user_id']].append(metadatum)
  for arr in user_id_to_metadata.values():
    arr.sort(key=lambda m: m['submitted'])
    for i in range(len(arr)):
      arr[i]['priority'] = calculate_priority(arr[i], arr[:i-1] if i > 0 else [])
  return user_id_to_metadata

def calculate_priority(current_sub_time: datetime.datetime, 
                       previous_sub_times: datetime.datetime) -> int:
  num_times_within_15_mins = 0
  for sub_time in previous_sub_times:
    if (current_sub_time - sub_time) <= datetime.timedelta(minutes=15):
      num_times_within_15_mins += 1
  return 60 * num_times_within_15_mins