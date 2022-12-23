from functools import reduce
import os
from os import path
from shutil import copyfileobj, copyfile
import gzip
import tarfile
from typing import Dict
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.sub_mime_types import SubmissionMIMEType
from py7zr import SevenZipFile
from zipfile import ZipFile
import requests
import fileinput

def extract_tar_file(from_path: str, to_path: str) -> None:
  with tarfile.open(from_path, "r:") as f:
    f.extractall(to_path)
    f.close()

def extract_tar_gz_file(from_path: str, to_path: str) -> None:
  with tarfile.open(from_path, "r:gz") as f:
    f.extractall(to_path)
    f.close()

def extract_gz_file(from_path: str, to_path: str) -> None:
  from_f_name = path.basename(from_path)
  with gzip.open(from_path, "rb") as f_in:
    with gzip.open(path.join(to_path, from_f_name)) as f_out:
      copyfileobj(f_in, f_out)
      f_in.close()
      f_out.close()

def extract_zip_file(from_path: str, to_path: str) -> None:
  with ZipFile(from_path) as f:
    f.extractall(to_path)
    f.close()

def extract_7zip_file(from_path: str, to_path: str) -> None:
  with SevenZipFile(from_path, mode='r') as f:
    f.extractall(path=to_path)
    f.close()

class CodeFileProcessor:

  def __init__(self, interpolated_dirs: Dict[str, str]) -> None:
    self.__interpolated_dirs = interpolated_dirs

  def process_file(self, code_file: CodeFileInfo, download_dir: str, extraction_dir: str) -> None:
    os.makedirs(download_dir)
    os.makedirs(extraction_dir)
    downloaded_file_path = self._download_code_file(code_file, download_dir)
    extracted_file_path = self._extract_code_file(code_file, downloaded_file_path, extraction_dir)
    if code_file.should_replace_paths():
      self.__replace_paths(extracted_file_path)

  # Useful to have this method as protected so that it can be overwritten in testing
  # (i.e., mock behavior for downloading can just be copying from a test fixture path).
  def _download_code_file(self, code_file: CodeFileInfo, download_path: str) -> str:
    file_name = code_file.get_file_name()
    file_path = path.join(download_path, file_name)
    with open(file_path, "wb") as f:
      web_reponse = requests.get(code_file.get_url())
      f.write(web_reponse.content)
      f.close()
    return file_path

  def _extract_code_file(self, code_file: CodeFileInfo, from_path: str, to_path: str) -> str:
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
    return path.join(to_path, code_file.get_file_name())
  
  def __replace_paths(self, file_path: str):
    if path.isdir(file_path):
      for file_name in os.scandir(file_path):
        self.__replace_paths(path.join(file_path, file_name))
    else:
      file_name = path.basename(file_path)
      dir_name = path.dirname(file_path)
      edited_file_name = file_name + '_edited'
      with open(file_path, 'r') as original_file:
        with open(edited_file_name, 'w') as edited_file:
          for line in original_file.readlines():
            edited_file.write(
              reduce(
                lambda current, key: current.replace(key, self.__interpolated_dirs[key]), 
                self.__interpolated_dirs,
                line)
            )
      os.remove(file_path)
      os.rename(path.join(dir_name, edited_file), file_path)
