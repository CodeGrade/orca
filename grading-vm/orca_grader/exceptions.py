class InvalidWorkerStateException(Exception):
  """
  Exception used to signal the the worker should be shut down altogether.
  """
  
  def __init__(self, msg: str = "The worker has reached an unclean state; this is most likely caused " \
               "by failure to shutdown a running job container.") -> None:
    self.msg = msg