from collections.abc import Callable
from subprocess import CompletedProcess
import subprocess
from typing import List


def create_runnable_subprocess(program_args: str | List[str]) -> Callable[[], CompletedProcess]:
  return lambda: subprocess.run(program_args, shell = type(program_args) == str, 
      check=True, capture_output=True)
