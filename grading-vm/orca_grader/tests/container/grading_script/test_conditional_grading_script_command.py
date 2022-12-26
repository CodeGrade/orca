import unittest
from orca_grader.container.grading_script.bash_grading_script_command import BashGradingScriptCommand
from orca_grader.container.grading_script.conditional_grading_script_command import ConditionalGradingScriptCommand, GradingScriptPredicate

class TestConditionalGradingScriptCommand(unittest.TestCase):

  def setUp(self) -> None:
    self.__expected_tap = "The correct command was reached."
    self.__unexpected_tap = "The incorrect command was reached."
    self.__correct_command = BashGradingScriptCommand(f"echo {self.__expected_tap}", 1)
    self.__incorrect_command = BashGradingScriptCommand(f"echo {self.__unexpected_tap}", 1)

  def test_file_exists_on_true(self):
    command = ConditionalGradingScriptCommand(self.__correct_command, 
        self.__incorrect_command, 
        "orca_grader/tests/fixtures/grading_job/base-test-job.json",
        GradingScriptPredicate.FILE)
    
    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_file_exists_on_false(self):
    command = ConditionalGradingScriptCommand(self.__incorrect_command,
        self.__correct_command,
        "404.html",
        GradingScriptPredicate.FILE)

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_dir_exists_on_true(self):
    command = ConditionalGradingScriptCommand(self.__correct_command,
        self.__incorrect_command,
        "orca_grader/tests",
        GradingScriptPredicate.DIR)

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_dir_exists_on_false(self):
    command = ConditionalGradingScriptCommand(self.__incorrect_command, 
        self.__correct_command,
        "non-existent-dir/",
        GradingScriptPredicate.DIR)

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_entity_exists_on_true_dir(self):
    command = ConditionalGradingScriptCommand(self.__correct_command,
        self.__incorrect_command,
        "orca_grader/tests",
        GradingScriptPredicate.EXISTS)

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_entity_exists_on_true_file(self):
    command = ConditionalGradingScriptCommand(self.__correct_command,
        self.__incorrect_command,
        "orca_grader/tests/fixtures/grading_job/base-test-job.json",
        GradingScriptPredicate.EXISTS)

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

  def test_entity_exists_on_false(self):
    command = ConditionalGradingScriptCommand(self.__incorrect_command,
        self.__correct_command,
        "non-existent",
        GradingScriptPredicate.EXISTS
        )

    output = command.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(responses), 1)
    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, self.__expected_tap)

