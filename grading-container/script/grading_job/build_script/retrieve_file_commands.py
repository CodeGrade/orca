class FileRetrievalCommand:
  """
  Abstract Command pattern class used for the downloading and saving/extracting
  of one/multiple code files to a given directory.
  """

  def __init__(self, file_path: str, save_dir_path: str) -> None:
    self._file_path: str = file_path
    self._save_dir_path: str = save_dir_path

  def execute() -> None:
    """
    Processes the retrieval and saving/extraction of one or more code files.
    """
    pass

  def get_file_path(self) -> str:
    return self._file_path

  def get_save_dir_path(self) -> str:
    return self._save_dir_path

class SingleFileRetrievalCommand(FileRetrievalCommand):

  def execute() -> None:
    pass

class ArchiveRetrievalCommand(FileRetrievalCommand):

  def execute() -> None:
    pass