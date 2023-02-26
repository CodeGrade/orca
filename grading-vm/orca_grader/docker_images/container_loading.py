import requests
import subprocess
from orca_grader.config import APP_CONFIG

__RETRIEVAL_TIMEOUT = 2.5 # seconds
__ORCA_IMAGE_URL = "{0}/images".format(APP_CONFIG.orca_web_server_host)

def retrieve_image_tgz_from_url(container_sha: str) -> None:
  with open("{0}.tgz".format(container_sha), 'wb') as tgz_fp:
    # TODO: Retry policy?
    response = requests.get("{0}/{1}.tgz".format(__ORCA_IMAGE_URL, container_sha), 
        timeout=__RETRIEVAL_TIMEOUT)
    tgz_fp.write(response.content)

def load_image_from_tgz(tgz_file_path: str) -> None:
  program_args = [
      "docker",
      "load",
      "-"
      ]
  with open(tgz_file_path, 'rb') as container_tgz_fp:
    subprocess.run(program_args, input=container_tgz_fp.read(), 
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
