import subprocess
from typing import List

def get_all_container_names() -> List[str]:
  container_ls_result = subprocess.run(
    ['docker', 'container', 'ls', '--format', '{{.Names}}'],
    capture_output=True)
  container_ls_output = container_ls_result.stdout.decode()
  return container_ls_output.split('\n')[:-1]
  