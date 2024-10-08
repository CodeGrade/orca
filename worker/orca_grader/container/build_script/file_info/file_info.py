from urllib.parse import urlparse, unquote
from os.path import basename
from orca_grader.common.types.grading_job_json_types import FileInfoJSON

class FileInfo:
  """
  FileInfo contains:
    - A URL to download/save/extract either an assignment, submission, or
      grading file.
    - The MIME type of that file.
    - The source of the code file. See ./code_file_source.py for more info.
  """

  def __init__(self, url: str, mime_type: str,
    save_dir_name: str, should_replace_paths: bool) -> None:
    self.__url = url
    self.__mime_type = mime_type
    self.__save_dir_name = save_dir_name
    self.__should_replace_paths = should_replace_paths

  def get_url(self) -> str:
    return self.__url

  def get_mime_type(self) -> str:
    return self.__mime_type

  def should_replace_paths(self) -> bool:
    return self.__should_replace_paths

  def get_save_dir_name(self) -> str:
    return self.__save_dir_name

  # https://stackoverflow.com/questions/18727347/how-to-extract-a-filename-from-a-url-append-a-word-to-it
  def get_file_name(self) -> str:
    """
    Extracts and returns the name of this file from its URL.
    """
    url_encoded_file_path = urlparse(self.__url).path
    file_path = unquote(url_encoded_file_path)
    return basename(file_path)

def json_to_file_info(json_code_file: FileInfoJSON, dir_name: str) -> FileInfo:
  return FileInfo(json_code_file["url"], json_code_file["mime_type"],
    dir_name, json_code_file["should_replace_paths"])
