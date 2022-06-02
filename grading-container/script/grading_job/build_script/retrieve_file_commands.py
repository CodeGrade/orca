from grading_job.build_script.code_file_info import CodeFileInfo 
from grading_job.build_script.code_file_source import CodeFileSource
from os import makedirs
from os.path import join
from requests import request

class FileRetrievalCommand:
  """
  Abstract Command pattern class used for the downloading and saving/extracting
  of one/multiple code files to a given directory.
  """

  def __init__(self, code_file_info: CodeFileInfo) -> None:
    self._code_file_info = code_file_info

  def execute(self) -> None:
    """
    Processes the retrieval and saving/extraction of one or more code files.
    """
    pass

  def _get_file_contents(self) -> bytes:
    """
    Given this command's code file, send an HTTP request to its URL and return
    the bytes contained in the HTTP response.
    """
    response = request("GET", self._code_file_info.get_url())
    file_contents = response.content
    return file_contents
  
  def get_code_file(self) -> str:
    return self._code_file_info

  def get_save_dir(self) -> str:
    return self._code_file_info.get_save_dir()

class SingleFileRetrievalCommand(FileRetrievalCommand):

  def execute(self) -> None:
    file_save_dir = self._code_file_info.get_save_dir()
    file_name = self._code_file_info.get_file_name()
    makedirs(file_save_dir)
    file_path = join(file_save_dir, file_name)
    file_contents = self._get_file_contents()
    file = open(file_path, "w")
    file.write(file_contents)
    file.close()

class ArchiveRetrievalCommand(FileRetrievalCommand):

  def execute(self) -> None:
    # 1. Download and save file to directory.
    # 2. Extract file based on MIME type.
    # 3. Remove original archive/compressed file.
    pass