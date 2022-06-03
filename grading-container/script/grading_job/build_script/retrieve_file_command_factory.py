from grading_job.build_script.code_file_info import CodeFileInfo
from grading_job.build_script.sub_mime_types import SubmissionMIMEType
from retrieve_file_commands import FileRetrievalCommand, GZipFileRetrievalCommnad, SingleFileRetrievalCommand, TarFileRetrievalCommand, TarGZFileRetrievalCommand, ZipFileRetrievalCommand


class FileRetrievalCommandFactory():
  """
  Factory pattern object that, given a code file object, 
  returns the proper concrete class of a FileRetrieval command
  that can properly download and save (as well as possibly extract)
  the contents of a file.
  """

  def get_file_retrieval_command(self, code_file_info: CodeFileInfo) -> FileRetrievalCommand:
    mime_type = code_file_info.get_mime_type()
    if mime_type == SubmissionMIMEType.ZIP:
      return ZipFileRetrievalCommand(code_file_info)
    elif mime_type == SubmissionMIMEType.TAR:
      return TarFileRetrievalCommand(code_file_info)
    elif mime_type == SubmissionMIMEType.GZ:
      return GZipFileRetrievalCommnad(code_file_info)
    elif mime_type == SubmissionMIMEType.TAR_GZ:
      return TarGZFileRetrievalCommand(code_file_info)
    else:
      return SingleFileRetrievalCommand(code_file_info)
