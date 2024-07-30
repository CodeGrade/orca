import os
import subprocess
from orca_grader.common.services.download_file import download_file


def retrieve_image_tgz_from_url(container_sha: str, images_url: str) -> None:
    file_name = "{0}.tgz".format(container_sha)
    download_file(images_url, file_name)


def load_image_from_tgz(tgz_file_path: str) -> None:
    program_args = [
        "docker",
        "load",
        "-i",
        tgz_file_path
    ]
    subprocess.run(program_args, stdout=subprocess.DEVNULL,
                   stderr=subprocess.STDOUT,
                   check=True)
    os.remove(tgz_file_path)  # To save resources, clean up tgz after load.
