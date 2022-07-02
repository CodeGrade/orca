class GradingScriptPreprocessor:

  def __init__(self, secret: str, max_retries: int) -> None:
    self.__interpolated_dirs = {
      "$ASSETS": "/assets",
      "EXTRACTED": f"{secret}_extracted",
      "BUILD": f"{secret}_build"
    }
    self.__max_retries = max_retries
    
  def process_job(self, grading_job):
    """
    """
    pass

  def __