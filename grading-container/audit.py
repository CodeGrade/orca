from enum import Enum
from typing import List
from datetime import datetime

class LogMessageType(Enum):
  INFO = 'INFO'
  ERROR = 'ERROR'
  WARNING = 'WARNING'
  DEBUG = 'DEBUG'

class Audit:
  """
  Used for logging events during grading job execution.
  """
  def __init__(self) -> None:
    self.__log: List[str] = []

  def log_details(self, msg: str, msg_type: LogMessageType):
    """
    Given a message (and possibly a prefix), add the message to the 
    log, prepended with a timestamp.
    """
    log_entry = f"[{datetime.now()}]: {msg_type.value}: {msg}"
    self.__log.append(log_entry)
  
  def get_complete_log(self) -> List[str]:
    return self.__log

