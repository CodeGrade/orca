from grading_job.build_script.code_file_info import CodeFileInfo 
from grading_job.build_script.code_file_source import CodeFileSource
from os import makedirs, remove
from os.path import join
from requests import request
import tarfile

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
  """
  Command pattern tasked with downloading and saving a single source code 
  file.
  """

  def execute(self) -> None:
    file_save_dir = self._code_file_info.get_save_dir()
    file_name = self._code_file_info.get_file_name()
    makedirs(file_save_dir)
    file_path = join(file_save_dir, file_name)
    file_contents = self._get_file_contents()
    file = open(file_path, "w")
    file.write(file_contents)
    file.close()

class ArchiveFileRetrievalCommand(FileRetrievalCommand):
  """
  Command pattern tasked with downloading an archived file and extracting 
  its contents into the proper folder.
  """

  def execute(self) -> None:
    # 1. Download and save file to directory.
    file_name = self._code_file_info.get_file_name()
    file_save_dir = self._code_file_info.get_save_dir()
    makedirs(file_save_dir)
    file_path = join(file_save_dir, file_name)
    file_contents = self._get_file_contents()
    file = open(file_path, "w")
    file.write(file_contents)
    file.close()
    # 2. Extract file based on MIME type.
    self._extract_files(file_path, file_save_dir)
    # 3. Remove original archive/compressed file.
    remove(file_path)

  def _extract_files(self, acv_file_path: str, extract_dir: str) -> None:
    """
    Abstract method for extract some number of files from a fiven
    archive/compressed file based on type.
    """
    pass


class TarFileRetrievalCommand(ArchiveFileRetrievalCommand):
  """
  Retrieval command that downloads, saves, and extracts the contents
  from a .tar file.
  """

  def _extract_files(self, acv_file_path: str, extract_dir: str) -> None:
    tf = tarfile.open(acv_file_path, "r")
    tf.extractall(extract_dir)
  

class ZipFileRetrievalCommand(ArchiveFileRetrievalCommand):
  """
  Retrival command that downloads, saves, and extracts the contents from
  a .zip file.
  """
  pass

class GZipFileRetrievalCommnad(ArchiveFileRetrievalCommand):
  """
  Retrieval command that downloads, saves, and extracts the contents 
  from a .gz file.
  """
  pass

class TarGZFileRetrievalCommand(ArchiveFileRetrievalCommand):
  """
  Retrieval command that downloads, saves, and extracts the contents
  from a .tgz/.tar.gz file.
  """
  pass