class FileRetrievalCommand:
  """
  Command pattern object used for the downloading and saving/extracting
  of one/multiple code files to a given directory.
  """

  def __init__(self, file_path: str, save_dir: str) -> None:
    pass

  def execute() -> None:
    """
    Processes the retrieval and saving/extraction of one or more code files.
    """
    pass

class SingleFileRetrievalCommand(FileRetrievalCommand):

  def execute() -> None:
    pass

class ZipFileRetrievalCommand(FileRetrievalCommand):

  def execute() -> None:
    pass