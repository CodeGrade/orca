import requests
import subprocess

__RETRIEVAL_TIMEOUT = 2.5 # seconds

def retrieve_image_tgz_from_url(image_url: str, respository: str, tag: str = "latest") -> None:
  with open("{0}-{1}.tgz".format(respository, tag), 'wb') as tgz_fp:
    response = requests.get(image_url, timeout=__RETRIEVAL_TIMEOUT)
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
