import subprocess
from typing import List


def does_image_exist_locally(container_tag: str) -> bool:
    program_args = [
        "docker",
        "image",
        "ls",
        "--format",
        "{{.Repository}}"
    ]
    proc_res = subprocess.run(program_args, capture_output=True, check=True)
    image_names = proc_res.stdout.decode().split('\n')[:-1]
    return container_tag in image_names


def get_all_docker_images() -> List[str]:
    res = subprocess.run(["docker", "image", "ls", "--format", "{{.Repository}}"],
                         capture_output=True)
    output = res.stdout.decode()
    image_names = output.split('\n')[:-1]
    if 'orca-grader-base' in image_names:
        image_names.remove('orca-grader-base')
    return image_names
