import unittest

class TestGradingScriptPreProcessor(unittest.TestCase):

  def setUp(self) -> None:
    interpolated_dirs = {
        "$DOWNLOADED": "secret/downloaded",
        "$EXTRACTED": "secret/extracted",
        "$ASSETS": "assets",
        "$BUILD": "secret/build"
    }

  def test_basic_script(self):
    # commands = []
    # code_files = []
    # preprocessor = GradingScriptPreprocessor("secret", commands, code_files, self.__code_file_processor)
    self.skipTest("Not yet written")
