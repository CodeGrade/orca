import json
import os
import shutil
import unittest

from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from orca_grader.container.build_script.code_file.sub_mime_types import SubmissionMIMEType


class TestCodeFileProcessor(unittest.TestCase):

  @classmethod
  def setUp(cls) -> None:
    code_files_json = {}
    with open("orca_grader/tests/fixtures/code_files/code_files.json", 'r') as code_files_fp:
      code_files_json = json.load(code_files_fp)
    cls.__code_files = { 
        k: CodeFileInfo(v["url"], SubmissionMIMEType(v["mime_type"]), k, v["should_replace_paths"])
        for k, v in code_files_json.items()
        }
    cls.__secret = os.urandom(32).hex()
    cls.__interpolated_dirs = {
        "$DOWNLOADED": f"{cls.__secret}/downloaded",
        "$EXTRACTED": f"{cls.__secret}/extracted",
        "$BUILD": f"{cls.__secret}/build"
        }
    cls.__download_extract_paths = {
        k: (
          os.path.join(cls.__interpolated_dirs["$DOWNLOADED"], k),
          os.path.join(cls.__interpolated_dirs["$EXTRACTED"], k),
        ) for k in cls.__code_files
    }
    cls.__expected_basic_content = "Hello, world!\n"
    cls.__expected_replaced_unchanged = "The build dir is $BUILD\n"
    cls.__expected_replaced_changed = f"The build dir is {cls.__interpolated_dirs['$BUILD']}\n"
    cls.__processor = CodeFileProcessor(cls.__interpolated_dirs)

  def test_basic_file(self):
    code_file = self.__code_files["basic-file"]
    download_path, extract_path = self.__download_extract_paths["basic-file"]
    self.__processor.process_file(self.__code_files["basic-file"], download_path, extract_path)
    self.assertTrue(os.path.exists(os.path.join(download_path, code_file.get_file_name())))
    self.assertTrue(os.path.exists(os.path.join(extract_path, code_file.get_file_name())))
    with open(f"{download_path}/basic-file.txt", 'r') as downloaded_fp:
      with open(f"{extract_path}/basic-file.txt", 'r') as extracted_fp:
        downloaded_content = downloaded_fp.read()
        extracted_content = extracted_fp.read()
        self.assertEqual(self.__expected_basic_content, downloaded_content)
        self.assertEqual(downloaded_content, extracted_content)

  def test_file_with_replace(self):
    code_file = self.__code_files["basic-file-replace"]
    download_path, extract_path = self.__download_extract_paths["basic-file-replace"]
    self.__processor.process_file(self.__code_files["basic-file-replace"], download_path, extract_path) 
    self.assertTrue(os.path.exists(os.path.join(download_path, code_file.get_file_name())))
    self.assertTrue(os.path.exists(os.path.join(extract_path, code_file.get_file_name())))
    with open(os.path.join(download_path, code_file.get_file_name()), 'r') as downloaded_fp:
      with open(os.path.join(extract_path, code_file.get_file_name()), 'r') as extracted_fp:
        downloaded_content = downloaded_fp.read()
        extracted_content = extracted_fp.read()
        self.assertEqual(self.__expected_replaced_unchanged, downloaded_content)
        self.assertEqual(self.__expected_replaced_changed, extracted_content)

  def test_gzip_empty_replace(self):
    code_file = self.__code_files["gzip-empty-replace"]
    self.assertEqual(code_file.get_mime_type().value, "application/gzip")
    download_path, extract_path = self.__download_extract_paths["gzip-empty-replace"]
    self.__processor.process_file(self.__code_files["gzip-empty-replace"], download_path, extract_path)
    self.assertTrue(os.path.exists(os.path.join(download_path, code_file.get_file_name())))
    unzipped_file_name = os.path.splitext(code_file.get_file_name())[0]
    self.assertTrue(os.path.exists(os.path.join(extract_path, unzipped_file_name)))

  def test_tar_gz_file_replace(self):
    code_file = self.__code_files["tar-gz-replace-paths"]
    download_path, extract_path = self.__download_extract_paths["tar-gz-replace-paths"]
    self.__processor.process_file(self.__code_files["tar-gz-replace-paths"], download_path, extract_path)
    self.assertTrue(os.path.exists(os.path.join(download_path, code_file.get_file_name())))
    self.assertTrue(os.path.isdir(os.path.join(extract_path, code_file.get_file_name().replace(".tar.gz", ""))))

  def test_tar_file_replace(self):
    code_file = self.__code_files["tar-replace-paths"]
    download_path, extract_path = self.__download_extract_paths["tar-replace-paths"]
    self.__processor.process_file(self.__code_files["tar-replace-paths"], download_path, extract_path)
    self.assertTrue(os.path.exists(os.path.join(download_path, code_file.get_file_name())))
    self.assertTrue(os.path.isdir(os.path.join(extract_path, code_file.get_file_name().replace(".tar", ""))))

  @classmethod
  def tearDown(cls) -> None:
    shutil.rmtree(cls.__secret)
