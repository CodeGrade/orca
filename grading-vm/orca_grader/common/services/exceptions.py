class PushResultsFailureException(Exception):
  
  def __init__(self, msg: str = "Failed to send results back to this job's response URL.") -> None:
    self.msg = msg