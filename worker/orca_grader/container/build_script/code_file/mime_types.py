from enum import Enum


class MIMEType(Enum):
    """
    An enumeration representing MIME types that files associated with an assignment
    or submission may take on.
    """

    TAR = "application/x-tar"
    GZ = "application/gzip"
    TAR_GZ = "application/x-gtar"
    ZIP = "application/zip"
    SEVEN_ZIP = "application/x-7z-compressed"
    JAVA = "text/x-java"
    JAVA_ARCHIVE = "application/java-archive"
    JAVA_CLASS = "application/java-vm"
    JAVASCRIPT = "text/javascript"
    PYRET = "pyret"
    RACKET_SCHEME = "scheme"
    LISP = "text/x-common-lisp"
    ML = "mllike"
    HASKELL = "text/x-haskell"
    LIT_HASKELL = "text/z-literate-haskell"
    PLAIN_TEXT = "text/plain"


ARCHIVE_MIMES = [MIMEType.ZIP, MIMEType.TAR,
                 MIMEType.GZ, MIMEType.TAR_GZ]


def is_archive_mime_type(mime_type: MIMEType) -> bool:
    return mime_type in ARCHIVE_MIMES
