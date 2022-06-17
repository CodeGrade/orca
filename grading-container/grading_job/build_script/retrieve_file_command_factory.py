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

  mime_to_command = {
    SubmissionMIMEType.ZIP: ZipFileRetrievalCommand,
    SubmissionMIMEType.TAR: TarFileRetrievalCommand,
    SubmissionMIMEType.GZ: GZipFileRetrievalCommnad,
    SubmissionMIMEType.TAR_GZ: TarGZFileRetrievalCommand
  }

  def get_file_retrieval_command(self, code_file_info: CodeFileInfo) -> FileRetrievalCommand:
    mime_type = code_file_info.get_mime_type()
    if mime_type in FileRetrievalCommandFactory.mime_to_command:
      return FileRetrievalCommandFactory.mime_to_command[mime_type](code_file_info)
    else:
      return SingleFileRetrievalCommand(code_file_info)
