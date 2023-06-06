from csv import DictReader
import json
import os
from enum import Enum
import sys
import time
from typing import Dict, List, Optional, Tuple
from orca_grader.queue_diagnostics import JobState

def __calculate_duration_per_job(reader: DictReader) -> Dict[str, float]:
  sub_id_to_states_and_times = dict()
  for row in reader:
    if row['Job Key'] not in sub_id_to_states_and_times:
      sub_id_to_states_and_times[row['Job Key']] = dict()
    sub_id_to_states_and_times[row['Job Key']][JobState(row['Job State'])] = int(row['Timestamp'])
  duration_for_sub_id = lambda k: sub_id_to_states_and_times[k][JobState.COMPLETED] - \
    sub_id_to_states_and_times[k][JobState.DEQUEUED]
  return { k: __ns_to_secs(duration_for_sub_id(k)) for k in sub_id_to_states_and_times}

def __ns_to_secs(ns: int) -> float:
  return ns / 1_000_000_000

if __name__ == '__main__':
  _, diagnostics_csv_path = sys.argv
  file_name = 'metadata_with_duration.json'
  metadata_file = 'orca_grader/tests/stress_tests/metadata.json'
  with open(metadata_file) as metadata_fp:
    metadata = json.load(metadata_fp)
    with open(diagnostics_csv_path) as diagnostics_fp:
      reader = DictReader(diagnostics_fp)
      sub_id_to_duration = __calculate_duration_per_job(reader)
      for sub_id in metadata:
        metadata[sub_id]['duration'] = sub_id_to_duration[sub_id]
  with open(file_name, 'w') as metadata_with_duration_fp:
    json.dump(metadata, metadata_with_duration_fp)

