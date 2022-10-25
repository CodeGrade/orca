from enum import Enum

class CodeFileSource(Enum):
  FIXTURE = "fixture_code"
  TARGET = "target_code"
  TEST = "test_code"