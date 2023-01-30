class ContainerConfiguration:

  def __init__(self, image_url: str, repository: str, tag: str) -> None:
    self.__image_url = image_url
    self.__repository = repository
    self.__tag = tag

  def get_image_url(self) -> str:
    return self.__image_url

  def get_repository(self) -> str:
    return self.__repository

  def get_tag(self) -> str:
    return self.__tag

