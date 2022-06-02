from grading_job.build_script.code_files import CodeFiles, generate_save_dir_path
from grading_job.build_script.exceptions import InvalidFilePathException
from grading_job.build_script.retrieve_file_commands import ArchiveRetrievalCommand, FileRetrievalCommand, SingleFileRetrievalCommand

# TODO: Other extensions? E.g., .tar and .tar.gz.
ARCHIVE_FILE_EXTENSIONS = [".zip"]

class RetrieveFileCommandFactory:
  """
  Factory used to return the proper command necessary to retrieve student,
  starter, or professor code -- being either a single file or archive of multiple
  files.
  """

  def generate_retrieval_command(self, code_files_spec: CodeFiles, file_path: str, 
    secret: str) -> FileRetrievalCommand:
    """
    Based on the provided details for what type of file is being retrieved, 
    return the proper command necessary to retrieve and/or extract all code.
    """
    file_ext = self.__get_file_extension(file_path)
    save_dir_path = generate_save_dir_path(code_files_spec, secret)
    if file_ext in ARCHIVE_FILE_EXTENSIONS:
      return ArchiveRetrievalCommand(file_path, save_dir_path)
    else:
      return SingleFileRetrievalCommand(file_path, save_dir_path)

  # TODO: Convert to regex? Probably that or file path lib.
  # TODO: Seems brittle; get feedback.
  def __get_file_extension(self, file_path: str) -> str:
    """
    Given a URL/local file path, process the path and retrieve the file 
    extension.
    """
    path_split_by_dir = file_path.split("/")
    file_name = path_split_by_dir[-1]
    fn_split_by_dot = file_name.split(".")
    # i.e., file path has no extension
    if len(fn_split_by_dot) == 1:
      raise InvalidFilePathException
    has_single_ext = len(fn_split_by_dot) == 2
    if has_single_ext:
      return fn_split_by_dot
    else: 
      # TODO: Could it have more than two extensions -- or at least, 
      # -relevant- extensions?
      return fn_split_by_dot[-2:]
