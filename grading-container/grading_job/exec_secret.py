from base64 import b64encode
from os import urandom

class GradingJobExecutionSecret:
  """
  Class with static method used to generate a secret for use during the execution
  of a GradingJob.
  """

  @staticmethod
  def get_secret(self) -> str:
    secret_length = 32
    os_bytes = urandom(secret_length)
    str_in_b64 = b64encode(os_bytes).decode()
    return str_in_b64