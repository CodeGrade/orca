import copy
import datetime
from functools import reduce
import json
import os
import shutil
from typing import Dict, List, Optional, Tuple
from orca_grader.tests.stress_tests.realistic_scenario import SubmissionMetadatum
from orca_grader.queue_diagnostics import JobState

QueueState = Tuple[datetime.datetime, List[datetime.datetime], List[SubmissionMetadatum]]

def run_simulation(metadata: Dict[str, SubmissionMetadatum], num_workers: int) \
    -> Tuple[List[QueueState], Dict[int, Dict[JobState, int]]]:
  if len(metadata) == 0 or num_workers < 1:
    raise ValueError('Cannot run simulation on empty metadata or less than one worker.')
  simulatable_metadata = process_metadata(metadata)
  min_timestamp = simulatable_metadata[0]['submitted']
  before_all_dt = min_timestamp - datetime.timedelta(milliseconds=1)
  workers = [before_all_dt for _ in range(num_workers)]
  queue_states: List[QueueState] = [(before_all_dt, copy.deepcopy(workers), [])]
  job_log = dict()
  curr_index = 0
  for metadatum in simulatable_metadata:
    print(curr_index)
    curr_index += 1
    prev_state = queue_states[-1]
    sub_created_dt = metadatum['submitted']
    job_log[metadatum['id']] = dict()
    job_log[metadatum['id']][JobState.CREATED] = sub_created_dt
    job_log[metadatum['id']][JobState.RELEASED] = sub_created_dt
    prev_back_log = copy.deepcopy(prev_state[2])
    while (worker_available(sub_created_dt, workers)) and len(prev_back_log) > 0:
      next_job = prev_back_log.pop(0)
      give_job_to_worker(next_job, workers, job_log)
    queue_states.append((sub_created_dt, copy.deepcopy(workers), prev_back_log + [metadatum]))
    if worker_available(sub_created_dt, workers) and len(prev_back_log) == 0:
      give_job_to_worker(metadatum, workers, job_log)
      queue_states.append((sub_created_dt + datetime.timedelta(seconds=metadatum['duration']),
                            copy.deepcopy(workers),
                            []))
  last_state = queue_states[-1]
  last_backlog = last_state[2]
  if len(last_backlog) == 0:
    return queue_states, job_log
  for i in range(len(copy.deepcopy(last_backlog))):
    curr_job = last_backlog[i]
    worker_to_get_job = copy.copy(workers[0])
    give_job_to_worker(curr_job, workers, job_log)
    queue_states.append((worker_to_get_job + datetime.timedelta(seconds=curr_job['duration']),
                          copy.deepcopy(workers),
                          last_backlog[i+1:] if i < len(last_backlog) - 1 else []))    
  return queue_states, job_log

def worker_available(dt: datetime.datetime, workers: List[datetime.datetime]) -> bool:
  return workers[0] <= dt

def process_metadata(metadata: Dict[str, SubmissionMetadatum]) -> List[SubmissionMetadatum]:
  index = 0
  for m in metadata:
    metadata[m]['submitted'] = datetime.datetime.now() + \
      datetime.timedelta(milliseconds=index)
    metadata[m]['duration'] = metadata[m]['duration'] * 1.5
    index += 1
  return sorted(list(metadata.values()), key=lambda m: m['submitted'])

def give_job_to_worker(job: SubmissionMetadatum, 
                       workers: List[datetime.datetime],
                       job_log: Dict[int, Dict[JobState, int]]) -> None:
  next_worker_to_finish = workers.pop(0)
  job_finished_at = calculate_job_finish_time(job, next_worker_to_finish)
  job_dequeued_at = job_finished_at - datetime.timedelta(seconds=job['duration'])
  job_log[job['id']][JobState.DEQUEUED] = job_dequeued_at
  job_log[job['id']][JobState.COMPLETED] = job_finished_at
  workers.append(job_finished_at)
  workers.sort()

def calculate_job_finish_time(job: SubmissionMetadatum, 
                              worker_finish_info: datetime.datetime) -> datetime.datetime:
  base_job_completion_dt = job['submitted'] + datetime.timedelta(seconds=job['duration'])
  secs_before_dequeue = (worker_finish_info - job['submitted']).total_seconds() \
    if worker_finish_info > job['submitted'] else 0
  return base_job_completion_dt + datetime.timedelta(seconds=secs_before_dequeue)

def compute_num_times_queue_cleared(queue_states: List[QueueState]) -> int:
  result = 0
  for i in range(len(queue_states)):
    _, _, backlog = queue_states[i]
    if i > 0 and len(backlog) == 0:
      result += 1
  return result

if __name__ == '__main__':
  metadata_fname = "orca_grader/tests/stress_tests/metadata_with_duration.json"
  with open(metadata_fname) as md_fp:
    realistic_metadata = json.load(md_fp)
    realistic_metadata = { md['id']: md for md in realistic_metadata }
  results = []
  for i in range(1, 11):
    queue_states, job_log = run_simulation(copy.deepcopy(realistic_metadata), i)
    num_times_queue_cleared = compute_num_times_queue_cleared(queue_states)
    max_backlog_len = max(list(map(lambda qs: len(qs[2]), queue_states)))
    max_delay = max({ k: (job_log[k][JobState.DEQUEUED] - job_log[k][JobState.RELEASED]).total_seconds() \
                 for k in job_log}.values())
    ans = {
            "num_workers": i,
            "max_backlog_length": max_backlog_len,
            "times_queue_cleared": num_times_queue_cleared,
            "max_delay": max_delay
          }
    results.append(ans)
    print(ans)
    with open('results.json', 'w') as results_fp:
      json.dump(results, results_fp)