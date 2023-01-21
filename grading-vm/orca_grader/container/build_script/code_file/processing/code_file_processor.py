from functools import reduce
import os
from os import path
from shutil import copyfileobj, copyfile
import gzip
import shutil
from typing import Dict
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.sub_mime_types import SubmissionMIMEType
import subprocess
import requests

__EXTRACTION_TIMEOUT = 60 * 2.5 # 2 minutes & 30 seconds

def __get_file_name_without_ext(file_name: str) -> str:
  current_name, current_ext = path.splitext(file_name)
  while current_ext != '':
    current_name, current_ext = path.splitext(current_name)
  return current_name

def extract_tar_file(from_path: str, to_path: str, compression_option: str = "") -> str:
  subprocess.run(["tar", f"-x{compression_option}f", from_path, "-C", to_path], 
      stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
  temp_extracted_path = path.join(to_path, __get_file_name_without_ext(path.basename(from_path)))
  shutil.copytree(temp_extracted_path, to_path, dirs_exist_ok=True)
  shutil.rmtree(temp_extracted_path)
  return to_path

def extract_gz_file(from_path: str, to_path: str) -> str:
  from_f_name = path.splitext(path.basename(from_path))[0] # Remove .gz from file name.
  f_out_path = path.join(to_path, from_f_name)
  with gzip.open(from_path, "rb") as f_in:
    with open(f_out_path, 'wb') as f_out:
      copyfileobj(f_in, f_out)
  return f_out_path

def extract_zip_file(from_path: str, to_path: str) -> str:
  subprocess.run(["unzip", from_path, "-d", to_path], stdout=subprocess.DEVNULL, 
      stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
  temp_extracted_path = path.join(to_path, __get_file_name_without_ext(path.basename(from_path)))
  shutil.copytree(temp_extracted_path, to_path, dirs_exist_ok=True)
  shutil.rmtree(temp_extracted_path)
  return to_path

def extract_7zip_file(from_path: str, to_path: str) -> str:
  subprocess.run(["7z", "x", from_path, f"-o{to_path}"], stdout=subprocess.DEVNULL, 
      stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
  return to_path
  
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
    if code_file.get_url().startswith('https://'):
      with open(file_path, "wb") as f:
        web_reponse = requests.get(code_file.get_url())
        f.write(web_reponse.content)
    else:
      copyfile(code_file.get_url(), file_path)
    return file_path

  def _extract_code_file(self, code_file: CodeFileInfo, from_path: str, to_path: str) -> str:
    mime_to_extraction = {
      SubmissionMIMEType.TAR: lambda from_path, to_path: extract_tar_file(from_path, to_path),
      SubmissionMIMEType.TAR_GZ: lambda from_path, to_path: extract_tar_file(from_path, to_path, 'z'),
      SubmissionMIMEType.GZ: extract_gz_file,
      SubmissionMIMEType.ZIP: extract_zip_file,
      SubmissionMIMEType.SEVEN_ZIP: extract_7zip_file
    }
    mime_type = code_file.get_mime_type()
    if mime_type in mime_to_extraction:
      extracted_path = mime_to_extraction[mime_type](from_path, to_path)
    else:
      extracted_path = path.join(to_path, code_file.get_file_name())
      copyfile(from_path, extracted_path)
    return extracted_path
  
  def __replace_paths(self, file_path: str):
    if path.isdir(file_path):
      for file_name in os.listdir(file_path):
        self.__replace_paths(path.join(file_path, file_name))
    else:
      file_name = path.basename(file_path)
      dir_name = path.dirname(file_path)
      name, ext = path.splitext(file_name)
      edited_file_name = f"{name}_edited{ext}"
      edited_file_path = path.join(dir_name, edited_file_name)
      with open(file_path, 'r') as original_file:
        with open(edited_file_path, 'w') as edited_file:
          for line in original_file.readlines():
            edited_file.write(
              reduce(
                lambda current, key: current.replace(key, self.__interpolated_dirs[key]), 
                self.__interpolated_dirs,
                line)
            )
      os.remove(file_path)
      os.rename(path.join(dir_name, edited_file_name), file_path)
