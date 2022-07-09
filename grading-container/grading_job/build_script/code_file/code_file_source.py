from enum import Enum

class CodeFileSource(Enum):
  """
  Enum that describes the source of the code file that
  may be processed for a grading job. Code file sources 
  are one of:

  - Fixture Code
  - Target Code
  - Test Code
  """
  
  FIXTURE = "fixture"
  TARGET = "target"
  TEST = "student"