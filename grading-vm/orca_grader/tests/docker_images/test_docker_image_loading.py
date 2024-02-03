import subprocess
import unittest
from os import path

from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_from_url, \
  load_image_from_tgz
from orca_grader.docker_utils.images.utils import does_image_exist_locally

def _remove_example_contianer() -> None:
  subprocess.run(["docker", "image", "rm", "hello-world"],
    stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

class TestDockerImageLoading(unittest.TestCase):

  @classmethod
  def setUpClass(cls) -> None:
    _remove_example_contianer()
    return super().setUpClass()
  
  def test_image_download_and_loading(self):
    retrieve_image_tgz_from_url("hello-world")
    self.assertTrue(path.exists("hello-world.tgz"))
    load_image_from_tgz("hello-world.tgz")
    self.assertTrue(does_image_exist_locally("hello-world"))
    self.assertFalse(path.exists("hello-world.tgz"))
  
  # @classmethod
  # def tearDownClass(cls) -> None:
  #   _remove_example_contianer()
  #   return super().tearDownClass()