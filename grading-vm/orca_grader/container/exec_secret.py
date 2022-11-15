from os import urandom

SECRET_LENGTH = 32

class GradingJobExecutionSecret:
  """
  Class with static method used to generate a secret for use during the execution
  of a GradingJob.
  """

  @staticmethod
  def get_secret() -> str:
    os_bytes = urandom(SECRET_LENGTH)
    return os_bytes.hex()
