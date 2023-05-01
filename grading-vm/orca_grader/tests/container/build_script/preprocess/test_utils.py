import json
from typing import List, Tuple
import unittest
from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON
from orca_grader.container.build_script.preprocess.utils import flatten_grading_script


class TestPreprocessorUtils(unittest.TestCase):

  @classmethod
  def setUpClass(cls) -> None:
    return super().setUpClass()  
  
  def test_flatten_grading_script_base_case(self):
    pass

  def test_flatten_grading_script_labels_only(self):
    input_json, output_json = load_input_output_json('1a.json', '1b.json')
    self.assertEqual(json.dumps(flatten_grading_script(input_json)), json.dumps(output_json))

  def test_flatten_grading_script_subscript_one_level_deep(self):
    input_json, output_json = load_input_output_json('2a.json', '2b.json')
    self.assertEqual(json.dumps(flatten_grading_script(input_json)), json.dumps(output_json))

  def test_flatten_grading_script_subscript_two_levels_deep(self):
    input_json, output_json = load_input_output_json('3a.json', '3b.json')
    self.assertEqual(json.dumps(flatten_grading_script(input_json)), json.dumps(output_json))

  def test_flatten_grading_script_two_subscripts_one_command(self):
    input_json, output_json = load_input_output_json('4a.json', '4b.json')
    self.assertEqual(json.dumps(flatten_grading_script(input_json)), json.dumps(output_json))

def load_input_output_json(input_file_name: str, output_file_name: str) \
  -> Tuple[List[GradingScriptCommandJSON], List[GradingScriptCommandJSON]]:
  input_json, output_json = None, None
  with open(f'orca_grader/tests/fixtures/grading_script/flatten_tests/{input_file_name}') as input_fp:
    input_json = json.load(input_fp)
  with open(f'orca_grader/tests/fixtures/grading_script/flatten_tests/{output_file_name}') as output_fp:
    output_json = json.load(output_fp)
  return input_json, output_json