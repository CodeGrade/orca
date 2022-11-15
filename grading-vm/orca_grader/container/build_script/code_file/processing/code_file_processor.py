from os.path import basename, join
from shutil import copyfileobj, copyfile
import gzip
import tarfile
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.sub_mime_types import SubmissionMIMEType
from py7zr import SevenZipFile
from zipfile import ZipFile
import requests

def extract_tar_file(from_path: str, to_path: str) -> None:
  f = tarfile.open(from_path, "r:")
  f.extractall(to_path)
  f.close()

def extract_tar_gz_file(from_path: str, to_path: str) -> None:
  f = tarfile.open(from_path, "r:gz")
  f.extractall(to_path)
  f.close()

def extract_gz_file(from_path: str, to_path: str) -> None:
  from_f_name = basename(from_path)
  f_in = gzip.open(from_path, "rb")
  f_out = gzip.open(join(to_path, from_f_name))
  copyfileobj(f_in, f_out)
  f_in.close()
  f_out.close()

def extract_zip_file(from_path: str, to_path: str) -> None:
  f = ZipFile(from_path)
  f.extractall(to_path)
  f.close()

def extract_7zip_file(from_path: str, to_path: str) -> None:
  f = SevenZipFile(from_path, mode='r')
  f.extractall(path=to_path)
  f.close()

class CodeFileProcessor:

  def process_file(self, code_file: CodeFileInfo, download_dir: str, extraction_dir: str) -> None:
    downloaded_file_path = self._download_code_file(code_file, download_dir)
    self._extract_code_file(code_file, downloaded_file_path, extraction_dir)

  # Useful to have this method as protected so that it can be overwritten in testing
  # (i.e., mock behavior for downloading can just be copying from a test fixture path).
  def _download_code_file(self, code_file: CodeFileInfo, download_path: str) -> str:
    file_name = code_file.get_file_name()
    file_path = join(download_path, file_name)
    with open(file_path, "wb") as f:
      web_reponse = requests.get(code_file.get_url())
      f.write(web_reponse.content)
      f.close()
    return file_path

  # TODO: There is no *explicit* need for this to return a file path, however...should it?
  def _extract_code_file(self, code_file: CodeFileInfo, from_path: str, to_path: str) -> None:
    mime_to_extraction = {
      SubmissionMIMEType.TAR: extract_tar_file,
      SubmissionMIMEType.TAR_GZ: extract_gz_file,
      SubmissionMIMEType.GZ: extract_gz_file,
      SubmissionMIMEType.ZIP: extract_zip_file,
      SubmissionMIMEType.SEVEN_ZIP: extract_7zip_file
    }
    mime_type = code_file.get_mime_type()
    if mime_type in mime_to_extraction:
      mime_to_extraction[mime_type](from_path, to_path)
    else:
      copyfile(from_path, to_path)
