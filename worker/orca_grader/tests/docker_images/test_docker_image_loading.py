import subprocess
import unittest
from os import path

from orca_grader.docker_utils.images.image_loading import retrieve_image_tgz_for_unique_name, \
    load_image_from_tgz
from orca_grader.docker_utils.images.utils import does_image_exist_locally


def _remove_example_container() -> None:
    subprocess.run(["docker", "image", "rm", "hello-world"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


class TestDockerImageLoading(unittest.TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        _remove_example_container()
        return super().setUpClass()

    def test_image_download_and_loading(self):
        retrieve_image_tgz_for_unique_name("http://localhost:9000/images", "hello-world")
        self.assertTrue(path.exists("hello-world.tgz"))
        load_image_from_tgz("hello-world.tgz")
        self.assertTrue(does_image_exist_locally("hello-world"))
        self.assertFalse(path.exists("hello-world.tgz"))

if __name__ == '__main__':
    unittest.main()
