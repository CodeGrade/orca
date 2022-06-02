from typing import List
from datetime import datetime

# Prefix types
ERROR = "ERROR"
WARNING = "WARNING"

# TODO: This should be a singleton. Find out how those are implemented
# in Python.
class Audit:
  """
  Used for logging events during grading job execution.
  """
  def __init__(self) -> None:
    self.__log: List[str] = []

  def log_details(self, msg: str, error: bool = False, warning: bool = False):
    """
    Given a message (and possibly a prefix), add the message to the 
    log, prepended with a timestamp.
    """
    log_entry = f"{datetime.now()}: "
    if error:
      log_entry += f"{ERROR}: {msg}"
    elif warning:
      log_entry += f"{WARNING}: {msg}"
    log_entry += f"{msg}"
    self.__log.append(msg)
  
  def get_complete_log(self) -> List[str]:
    return self.__log