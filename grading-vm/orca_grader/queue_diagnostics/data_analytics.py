from csv import DictReader, DictWriter
import os
from enum import Enum
import sys
import time
from typing import Dict, List, Optional, Tuple
from orca_grader.queue_diagnostics import JobState

def __write_delay_per_job_to_file(diagnostics_file_path: str, output_dir: Optional[str] = None):
  file_name = 'delay_per_job.csv'
  with open(file_name if output_dir is None else os.path.join(output_dir, file_name), 'w') as output_fp:
    fieldnames = ["Job Key", "Delay"]
    csv_writer = DictWriter(output_fp, fieldnames=fieldnames)
    csv_writer.writeheader()
    key_to_delay_dict = __measure_delay_per_job(diagnostics_file_path)
    csv_writer.writerows([{ "Job Key": k, "Delay": d} for k, d in key_to_delay_dict.items()])

def __measure_delay_per_job(diagnostics_file_path: str) -> Dict[str, int]:
  jobs_dict = dict()
  with open(diagnostics_file_path, 'r') as csv_fp:
    reader = DictReader(csv_fp)
    for row in reader:
      if row['Job Key'] not in jobs_dict:
        jobs_dict[row['Job Key']] = dict()
      jobs_dict[row['Job Key']][JobState(row['Job State'])] = int(row['Timestamp'])
  delays_dict = dict()
  for job_key, state_times in jobs_dict.items():
    delays_dict[job_key] = __ns_to_secs(state_times[JobState.DEQUEUED] - state_times[JobState.CREATED])
  return delays_dict

def __write_queue_length_over_time_to_file(diagnostics_file_path: str, output_dir: Optional[str] = None):
  file_name = "queue_length_over_time.csv"
  with open(file_name if output_dir is None else os.path.join(output_dir, file_name), 'w') as output_fp:
    field_names = ["Seconds", "Queue Length"]
    csv_writer = DictWriter(output_fp, fieldnames=field_names)
    csv_writer.writeheader()
    csv_writer.writerows([{"Seconds": t, "Queue Length": l} for t, l in __measure_queue_length_over_time(diagnostics_file_path)])

def __measure_queue_length_over_time(diagnostics_file_path: str) -> List[Tuple[int, int]]:
  min_timestamp = None
  times_and_queue_lengths = list()
  with open(diagnostics_file_path, 'r') as csv_fp:
    reader = DictReader(csv_fp)
    for row in reader:
      timestamp, queue_length = tuple([int(v) for v in (row['Timestamp'], row['Queue Length'])])
      times_and_queue_lengths.append((timestamp, queue_length))
      min_timestamp = timestamp if min_timestamp is None else min(timestamp, min_timestamp)
  format_timestamp = lambda t: __ns_to_secs(t - min_timestamp)
  return [(format_timestamp(t), q) for t, q in times_and_queue_lengths]

def __ns_to_secs(ns: int) -> float:
  return ns / 1_000_000_000

if __name__ == '__main__':
  _, diagnostics_csv_path = sys.argv
  file_timestamp = time.time_ns()
  dir_name = 'diagnostics/analytics/{}'.format(file_timestamp)
  os.makedirs(dir_name)
  __write_delay_per_job_to_file(diagnostics_csv_path, output_dir=dir_name)
  __write_queue_length_over_time_to_file(diagnostics_csv_path, output_dir=dir_name)

