import unittest
from orca_grader.container.build_script.preprocess import GradingScriptPreprocessor
from orca_grader.tests.mocks.container.build_script.code_file.processing.code_file_processor import MockCodeFileProcessor

class TestGradingScriptPreProcessor(unittest.TestCase):

  def setUp(self) -> None:
    interpolated_dirs = {
        "$DOWNLOADED": "secret/downloaded",
        "$EXTRACTED": "secret/extracted",
        "$ASSETS": "assets",
        "$BUILD": "secret/build"
    }
    self.__code_file_processor = MockCodeFileProcessor(interpolated_dirs)

  def test_basic_script(self):
    # commands = []
    # code_files = []
    # preprocessor = GradingScriptPreprocessor("secret", commands, code_files, self.__code_file_processor)
    self.skipTest("Not yet written")
