from collections.abc import Callable
from subprocess import CompletedProcess
import subprocess
from typing import List

__JOB_EXECUTION_TIMEOUT = 10 * 60 # 10 minutes

def create_runnable_job_subprocess(program_args: str | List[str]) -> Callable[[], CompletedProcess]:
  return lambda: subprocess.run(program_args, shell = type(program_args) == str, 
      check=True, capture_output=True, timeout=__JOB_EXECUTION_TIMEOUT)
