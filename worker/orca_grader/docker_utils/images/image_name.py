import logging
from typing import Optional
from orca_grader.docker_utils.images.utils import get_all_docker_images

_LOGGER = logging.getLogger(__name__)


def get_image_name_for_sha(container_sha: str) -> Optional[str]:
    matching_images = list(
        filter(lambda name: container_sha in name, get_all_docker_images()))
    if len(matching_images) > 1:
        _LOGGER.warn("More than one image found with given "
                     f"SHA sum: {', '.join(matching_images)}")
    _LOGGER.debug(matching_images)
    return matching_images[0] if len(matching_images) > 0 else None
