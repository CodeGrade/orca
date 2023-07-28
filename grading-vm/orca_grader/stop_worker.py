import signal
import threading

from orca_grader.common.types.grading_job_json_types import GradingJobJSON

class GracefulKiller:
  """
  Idea pulled from https://stackoverflow.com/questions/18499497/how-to-process-sigterm-signal-gracefully.
  """
  
  def __init__(self) -> None:
    self.event = threading.Event()
    self.sigint_handler = signal.signal(signal.SIGINT, self.exit_gracefully)
    self.sigterm_handler = signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self, *args):
    self.event.set()
  
  def wait_for_stop_signal(self):
    self.event.wait()

  # NOTE: enter and exit needed to make class usable witth Python's with statement.
  def __enter__(self):
    return self
  
  # Resets the original signal handlers for sigint and sigterm
  # to ensure program is cleaned up properly after this instance
  # dies in a with statement.
  def __exit__(self, exc_type, exc_value, traceback):
    signal.signal(signal.SIGINT, self.sigint_handler)
    signal.signal(signal.SIGTERM, self.sigterm_handler)

