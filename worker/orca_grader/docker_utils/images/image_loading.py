import logging
import os
import re
import subprocess
from orca_grader.common.services.download_file import download_file
from orca_grader.config import APP_CONFIG


_LOGGER = logging.getLogger(__name__)


def retrieve_image_tgz_for_sha(container_sha: str) -> None:
    file_name = f"{container_sha}.tgz"
    images_url = f"{APP_CONFIG.orca_web_server_host}/images/{file_name}"
    _LOGGER.debug(f"Attempting to download image from {images_url}")
    download_file(images_url, file_name)
    _LOGGER.debug("Image downloaded.")


def load_image_from_tgz(tgz_file_path: str) -> str:
    program_args = [
        "docker",
        "load",
        "-i",
        tgz_file_path
    ]
    _LOGGER.debug(f"Attempting to load image from file {tgz_file_path}")
    result = subprocess.run(program_args, check=True, capture_output=True)
    _LOGGER.debug(f"Docker save stdout: {result.stdout.decode() if result.stdout is not None else '<None>' }")
    _LOGGER.debug(f"Docker save stderr: {result.stderr.decode() if result.stderr is not None else '<None>' }")
    _LOGGER.debug("Image loaded.")
    # os.remove(tgz_file_path)  # To save resources, clean up tgz after load.
    # _LOGGER.debug("Image tgz file removed.")
    return get_name_from_load_output(result.stderr.decode())


def get_name_from_load_output(stderr: str) -> str:
    pattern = re.compile(r"^Loaded image\: (.*)$")
    match = pattern.match(stderr)
    return match.group(1)


if __name__ == '__main__':
    print(get_name_from_load_output("Loaded image: orca-grader-base:latest\n"))
