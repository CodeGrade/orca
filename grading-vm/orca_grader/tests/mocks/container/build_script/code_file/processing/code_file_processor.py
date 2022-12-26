from os import path
from shutil import copyfile
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo


class MockCodeFileProcessor(CodeFileProcessor):

  # Used with code file that contains a local file path instead of a URL.
  def _download_code_file(self, code_file: CodeFileInfo, download_path: str) -> str:
    code_file_basename = code_file.get_file_name()
    downloaded_file_path = path.join(download_path, code_file_basename)
    copyfile(code_file.get_url(), downloaded_file_path)
    return downloaded_file_path

