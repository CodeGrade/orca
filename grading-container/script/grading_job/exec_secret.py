from base64 import b64encode
from os import urandom

class GradingJobExecutionSecret:
  """
  Singleton class that contains a secret to be used by various strings,
  file paths, and more during the execution of a grading job.

  The secret is a randomly generated 32-bit, base64 string.
  """

  def __init__(self) -> None:
    secret_length = 32
    os_bytes = urandom(secret_length)
    str_in_b64 = b64encode(os_bytes).decode()
    self.__secret = str_in_b64
  
  def get_secret(self) -> str:
    return self.__secret