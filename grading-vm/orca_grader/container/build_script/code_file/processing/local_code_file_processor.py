from os import path
from shutil import copyfile
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor

class LocalCodeFileProcessor(CodeFileProcessor):

  def _download_code_file(self, code_file: CodeFileInfo, download_path: str) -> str:
    local_file_path = code_file.get_url()
    local_file_name = code_file.get_file_name()
    downloaded_file_path = path.join(download_path, local_file_name)
    copyfile(local_file_path, downloaded_file_path)
    return downloaded_file_path
