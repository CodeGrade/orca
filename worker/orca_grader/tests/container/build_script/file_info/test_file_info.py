import json
import unittest
from orca_grader.container.build_script.file_info.file_info import json_to_file_info

class TestCodeFileInfo(unittest.TestCase):

  def test_URL_base_name(self):
    job_json = None
    with open("orca_grader/tests/fixtures/grading_job/live-URL-student-only.json", 'r') as job_fp:
      job_json = json.load(job_fp)
    file_info = json_to_file_info(job_json["files"]["target_code"], "target_code")
    expected_name = "HW04.zip"
    self.assertEqual(file_info.get_file_name(), expected_name)

