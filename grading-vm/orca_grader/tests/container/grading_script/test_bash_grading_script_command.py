import unittest
from orca_grader.container.grading_script.bash_grading_script_command import BashGradingScriptCommand

class TestBashGradingScriptCommand(unittest.TestCase):

  def test_failing_command_aborts(self):
    command = BashGradingScriptCommand("(exit 1)", 10)
    output = command.execute([])
    responses = output.get_command_responses()
    exceptions = output.get_execution_errors()
    tap_output = output.get_tap_output()

    self.assertEqual(len(exceptions), 0)
    self.assertIsNone(tap_output)

    self.assertEqual(len(responses), 1)
    response = responses[0]
    self.assertEqual(response.get_stdout_output(), "")
    self.assertEqual(response.get_stderr_output(), "")
    self.assertFalse(response.did_time_out())
    self.assertEqual(response.get_status_code(), 1)

  def test_completable_bash_script_command(self):
    expected_tap = "this should output"
    command = BashGradingScriptCommand(f"echo {expected_tap}", 10)
    
    output = command.execute([])

    responses = output.get_command_responses()
    exceptions = output.get_execution_errors()
    tap_output = output.get_tap_output()

    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, expected_tap)
    
    self.assertEqual(len(responses), 1)
    response = responses[0]

    self.assertEqual(response.get_stderr_output(), "")
    self.assertEqual(response.get_stdout_output(), expected_tap)
    self.assertFalse(response.did_time_out())
    self.assertEqual(response.get_status_code(), 0)
