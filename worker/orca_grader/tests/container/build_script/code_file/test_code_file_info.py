import json
import unittest
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo, \
    json_to_code_file_info

class TestCodeFileInfo(unittest.TestCase):

  def test_URL_base_name(self):
    job_json = None
    with open("orca_grader/tests/fixtures/grading_job/live-URL-student-only.json", 'r') as job_fp:
      job_json = json.load(job_fp)
    code_file = json_to_code_file_info(job_json["code_files"]["target_code"], "target_code")
    expected_name = "HW04.zip"
    self.assertEqual(code_file.get_file_name(), expected_name)

