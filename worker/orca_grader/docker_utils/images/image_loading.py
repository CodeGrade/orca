import logging
import os
import subprocess
from orca_grader.common.services.download_file import download_file


_LOGGER = logging.getLogger(__name__)


def retrieve_image_tgz_from_url(container_sha: str, images_url: str) -> None:
    file_name = "{0}.tgz".format(container_sha)
    _LOGGER.debug(f"Attempting to download image from {images_url}")
    download_file(images_url, file_name)
    _LOGGER.debug("Image downloaded.")


def load_image_from_tgz(tgz_file_path: str) -> None:
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
