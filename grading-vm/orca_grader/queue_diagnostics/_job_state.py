from enum import Enum

class JobState(str, Enum):
  CREATED = "created"
  RELEASED = "released"
  DEQUEUED = "dequeued"
  COMPLETED = "completed"