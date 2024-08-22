import logging
import os
import re
import subprocess
from typing import Optional
from orca_grader.common.services.download_file import download_file
from orca_grader.config import APP_CONFIG


_LOGGER = logging.getLogger(__name__)


def retrieve_image_tgz_for_unique_name(unique_name: str) -> str:
    file_name = f"{unique_name}.tgz"
    images_url = f"{APP_CONFIG.orca_web_server_host}/images/{file_name}"
    _LOGGER.debug(f"Attempting to download image from {images_url}")
    download_file(images_url, file_name)
    _LOGGER.debug("Image downloaded.")
    return file_name


def load_image_from_tgz(tgz_file_path: str) -> Optional[str]:
    program_args = [
        "docker",
        "load",
        "-i",
        tgz_file_path
    ]
    try:
        _LOGGER.debug(f"Attempting to load image from file {tgz_file_path}")
        result = subprocess.run(program_args, check=True, capture_output=True)
        _LOGGER.debug(
            f"Docker save stdout: {result.stdout.decode() if result.stdout is not None else '<None>' }")
        _LOGGER.debug(
            f"Docker save stderr: {result.stderr.decode() if result.stderr is not None else '<None>' }")
        _LOGGER.debug("Image loaded.")
        # os.remove(tgz_file_path)  # To save resources, clean up tgz after load.
        # _LOGGER.debug("Image tgz file removed.")
        return result.stderr and get_name_from_load_output(result.stdout)
    except Exception as e:
        if isinstance(e, subprocess.CalledProcessError):
            _LOGGER.debug(
                f"Docker save stdout: {e.stdout.decode() if e.stdout is not None else '<None>' }")
            _LOGGER.debug(
                f"Docker save stderr: {e.stderr.decode() if e.stderr is not None else '<None>' }")
        raise e

def get_name_from_load_output(docker_load_stdout: str) -> Optional[str]:
    pattern = re.compile(r"^Loaded image: ([a-zA-Z0-9/:_-]+)")
    match = pattern.match(docker_load_stdout)
    return match.group(1) if len(match.groups()) == 2 else None
