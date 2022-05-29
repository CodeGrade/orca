from typing import List
from datetime import datetime

# Prefix types
ERROR = "ERROR"
WARNING = "WARNING"

class Audit:
  """ Used for logging event during grading job execution. """
  def __init__(self) -> None:
    self.__logger: List[str] = []

  def log(self, msg: str, prefix: str = None):
    log_entry: str = ""
    log_entry = f"{datetime.now()}: "
    if prefix:
      log_entry += f"{prefix}: {msg}"
    log_entry += f"{msg}"
    self.__logger.append(msg)