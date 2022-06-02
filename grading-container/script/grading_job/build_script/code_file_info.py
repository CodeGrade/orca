from urllib.parse import urlparse, unquote
from os.path import basename
from grading_job.build_script.code_file_source import CodeFileSource
from grading_job.build_script.sub_mime_types import SubmissionMIMEType

class CodeFileInfo:
  """
  CodeFileInfo contains:
    - A URL to download/save/extract either an assignment, submission, or 
      grading file.
    - The MIME type of that file.
    - The source of the code file, being either:
        - The Assignment (i.e., Starter Code)
        - The Student/Submission
        - The Professor (i.e., Tests for grading)
  """

  def __init__(self, url: str, mime_type: SubmissionMIMEType, 
    code_file_source: CodeFileSource) -> None:
    self.__url = url
    self.__mime_type = mime_type
    self.__code_file_source = code_file_source

  def get_url(self) -> str:
    return self.__url
  
  def get_mime_type(self) -> SubmissionMIMEType:
    return self.__mime_type
  
  def get_code_file_source(self) -> CodeFileSource:
    return self.__code_file_source
  
  def get_save_dir(self, secret: str) -> str:
    """
    Gets the name of the directory to save and extract files to.
    """
    return f"{secret}_{self.__code_file_source.value}"
  
  # https://stackoverflow.com/questions/18727347/how-to-extract-a-filename-from-a-url-append-a-word-to-it
  def get_file_name(self) -> str:
    """
    Extracts and returns the name of this file from its URL.
    """
    url_encoded_file_path = urlparse(self.__url).path
    file_path = unquote(url_encoded_file_path)
    return basename(file_path)

