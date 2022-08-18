from os import urandom

class GradingJobExecutionSecret:
  """
  Class with static method used to generate a secret for use during the execution
  of a GradingJob.
  """

  @staticmethod
  def get_secret() -> str:
    secret_length = 32
    os_bytes = urandom(secret_length)
    return os_bytes.hex()