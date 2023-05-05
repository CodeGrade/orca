import os
import subprocess
from orca_grader.common.services.download_file import download_file
from orca_grader.config import APP_CONFIG

__ORCA_IMAGE_URL = "{0}/images".format(APP_CONFIG.orca_web_server_host)

def retrieve_image_tgz_from_url(container_sha: str) -> None:
  file_name = "{0}.tgz".format(container_sha)
  download_url = f"{__ORCA_IMAGE_URL}/{file_name}"
  download_file(download_url, file_name)

def load_image_from_tgz(tgz_file_path: str) -> None:
  program_args = [
      "docker",
      "load",
      "-i",
      tgz_file_path
      ]
  with open(tgz_file_path, 'rb') as container_tgz_fp:
    subprocess.run(program_args, stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        check=True)
  os.remove(tgz_file_path) # To save resources, clean up tgz after load.
