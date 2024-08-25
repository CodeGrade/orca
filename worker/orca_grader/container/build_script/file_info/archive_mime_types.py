from enum import Enum

class ArchiveMIMEType(Enum):
    TAR = "application/x-tar"
    GZ = "application/gzip"
    TAR_GZ = "application/x-gtar"
    ZIP = "application/zip"
    SEVEN_ZIP = "application/x-7z-compressed"

def is_archive_mime_type(mime_type: str) -> bool:
    try:
        ArchiveMIMEType(mime_type)
        return True
    except ValueError:
        return False

