import json
import os
import unittest
from orca_grader.container.build_script.cycle_detection.cycle_detector import CycleDetector

class TestCycleDetector(unittest.TestCase):

  __FIXTURE_PATHS = list(
    map(
      lambda fname: 'orca_grader/tests/fixtures/grading_script/' + fname, 
      [
        "basic-grading-script.json", 
        "non-dag-multi-node-cycle-grading-script.json", 
        "non-dag-single-node-cycle-grading-script.json"
      ]
    )
  )
  
  def test_detection_on_valid_script(self):
    grading_script = self.__load_json(self.__FIXTURE_PATHS[0])
    has_cycle = CycleDetector.contains_cycle(grading_script)
    self.assertFalse(has_cycle)

  def test_detection_non_dag_multi_node_path(self):
    grading_script = self.__load_json(self.__FIXTURE_PATHS[1])
    has_cycle = CycleDetector.contains_cycle(grading_script)
    self.assertTrue(has_cycle)

  def test_detection_non_dag_singly_node_path(self):
    grading_script = self.__load_json(self.__FIXTURE_PATHS[2])
    has_cycle = CycleDetector.contains_cycle(grading_script)
    self.assertTrue(has_cycle)

  def __load_json(self, path: str) -> any:
    with open(path, 'r') as json_fp:
      return json.load(json_fp)

if __name__ == '__main__':
  print(os.getcwd())
  unittest.main()
