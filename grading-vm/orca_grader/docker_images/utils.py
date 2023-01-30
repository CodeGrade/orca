import subprocess
from typing import List

def does_image_exist(repository: str, tag: str|None = None) -> bool:
  program_args = [
      "docker", 
      "image", 
      "ls", 
      "--format",
      "\"{{.Repository}}:{{.Tag}}\""
      ]
  proc_res = subprocess.run(program_args, capture_output=True)
  image_names = proc_res.stdout.decode().split('\n')[:-1]
  return "{0}:{1}".format(repository, tag) in image_names


def get_all_docker_images() -> List[str]:
  res = subprocess.run(["docker", "image", "ls", "--format", "\"{{.Repository}}:{{.Tag}}\""],
      capture_output=True)
  output = res.stdout.decode()
  image_tags = output.split('\n')[:-1]
  return image_tags

