from enum import Enum

class CodeFileSource(Enum):
  """
  Enum that describes the source of the code file that
  may be processed for a grading job. Code file sources 
  are one of:

  - Starter Code
  - Student Code
  - Professor Code (Tests)
  """
  
  STARTER_CODE = "starter"
  STUDENT_CODE = "student"
  PROFESSOR_CODE = "professor"