import subprocess
from typing import List
from orca_grader.docker_utils.images.utils import get_all_docker_images

# NOTE: Docker image name lists always have a trailing new line, hence
# why the lists generated from string splitting include all but the last string.


def __get_images_used_in_last_day() -> List[str]:
    """
    Returns the tags of all docker images used in the last day.
    """
    res = subprocess.run(["docker", "events", "--since", "24h", "--until", "0m",
                          "--filter=\"type=container\"", "--filter=\"event=start\"", "--format", "{{.From}}"],
                         capture_output=True, check=True)
    output = res.stdout.decode()
    image_shas = output.split('\n')[:-1]
    return image_shas


def clean_up_unused_images() -> None:
    all_images = set(get_all_docker_images())
    images_used_in_last_day = set(__get_images_used_in_last_day())
    images_to_remove = all_images - images_used_in_last_day
    for image in images_to_remove:
        subprocess.run(["docker", "image", "rm", image], stdout=subprocess.DEVNULL,
                       stderr=subprocess.STDOUT)
