from enum import Enum

class JobState(Enum):
  CREATED = "created"
  RELEASED = "released"
  DEQUEUED = "dequeued"
  COMPLETED = "completed"