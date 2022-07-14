from enum import Enum

class CodeFileSource(Enum):
  FIXTURE = "fixture"
  TARGET = "target"
  TEST = "test"