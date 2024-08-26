from functools import reduce
import os
from os import path
from shutil import copyfileobj, copyfile
import gzip
from typing import Dict
from orca_grader.container.build_script.file_info.file_info import FileInfo
from orca_grader.container.build_script.file_info.archive_mime_types import ArchiveMIMEType, is_archive_mime_type
import subprocess
from orca_grader.common.services.download_file import download_file

__EXTRACTION_TIMEOUT = 60 * 2.5  # 2 minutes & 30 seconds


def extract_tar_file(from_path: str, to_path: str, compression_option: str = "") -> str:
    subprocess.run(["tar", f"-x{compression_option}f", from_path, "-C", to_path],
                   stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
    return to_path


def extract_gz_file(from_path: str, to_path: str) -> str:
    # Remove .gz from file name.
    from_f_name = path.splitext(path.basename(from_path))[0]
    f_out_path = path.join(to_path, from_f_name)
    with gzip.open(from_path, "rb") as f_in:
        with open(f_out_path, 'wb') as f_out:
            copyfileobj(f_in, f_out)
    return f_out_path


def extract_zip_file(from_path: str, to_path: str) -> str:
    subprocess.run(["unzip", from_path, "-d", to_path], stdout=subprocess.DEVNULL,
                   stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
    return to_path


def extract_7zip_file(from_path: str, to_path: str) -> str:
    subprocess.run(["7z", "x", from_path, f"-o{to_path}"], stdout=subprocess.DEVNULL,
                   stderr=subprocess.STDOUT, timeout=__EXTRACTION_TIMEOUT)
    return to_path


class FileProcessor:

    def __init__(self, interpolated_dirs: Dict[str, str]) -> None:
        self.__interpolated_dirs = interpolated_dirs

    def process_file(self, code_file: FileInfo, download_dir: str, extraction_dir: str) -> None:
        os.makedirs(download_dir)
        os.makedirs(extraction_dir)
        downloaded_file_path = self._download_code_file(
            code_file, download_dir)
        extracted_file_path = self._extract_code_file(
            code_file, downloaded_file_path, extraction_dir)
        if code_file.should_replace_paths():
            self.__replace_paths(extracted_file_path)

    def _download_code_file(self, code_file: FileInfo, download_path: str) -> str:
        file_name = code_file.get_file_name()
        file_path = path.join(download_path, file_name)
        return download_file(code_file.get_url(), file_path)

    def _extract_code_file(self, code_file: FileInfo, from_path: str, to_path: str) -> str:
        mime_to_extraction = {
            ArchiveMIMEType.TAR: lambda from_path, to_path: extract_tar_file(from_path, to_path),
            ArchiveMIMEType.TAR_GZ: lambda from_path, to_path: extract_tar_file(from_path, to_path, 'z'),
            ArchiveMIMEType.GZ: extract_gz_file,
            ArchiveMIMEType.ZIP: extract_zip_file,
            ArchiveMIMEType.SEVEN_ZIP: extract_7zip_file
        }
        mime_type = code_file.get_mime_type()
        if is_archive_mime_type(mime_type):
            extracted_path = mime_to_extraction[ArchiveMIMEType(mime_type)](from_path, to_path)
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
                                lambda current, key: current.replace(
                                    key, self.__interpolated_dirs[key]),
                                self.__interpolated_dirs,
                                line)
                        )
            os.remove(file_path)
            os.rename(path.join(dir_name, edited_file_name), file_path)
