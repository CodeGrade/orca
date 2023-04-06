import os
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
    command = BashGradingScriptCommand(["echo", expected_tap], 10)
    
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

  def test_timeout_bash_command(self):
    command = BashGradingScriptCommand("yes", 0.01)

    output = command.execute([])

    responses = output.get_command_responses()
    exceptions = output.get_execution_errors()
    tap_output = output.get_tap_output()

    self.assertEqual(len(exceptions), 0)
    self.assertIsNone(tap_output)

    self.assertEqual(len(responses), 1)
    response = responses[0]
    self.assertEqual(response.get_stderr_output(), "")
    self.assertNotEqual(response.get_stdout_output(), "")
    self.assertTrue(response.did_time_out)

  def test_bash_command_traverses_on_fail(self):
    expected_tap = "this should be reached upon first failure"
    second_cmd = BashGradingScriptCommand(["echo", expected_tap], 1)
    first_cmd = BashGradingScriptCommand("(exit 1)", 1, on_fail=second_cmd)

    output = first_cmd.execute([])
    responses = output.get_command_responses()
    exceptions = output.get_execution_errors()
    tap_output = output.get_tap_output()

    self.assertEqual(exceptions, [])
    self.assertEqual(tap_output, expected_tap)
    
    self.assertEqual(len(responses), 2)
    for response in responses:
      self.assertEqual(response.get_stderr_output(), "")
    self.assertEqual(responses[1].get_stdout_output(), expected_tap)

  def test_bash_command_traverses_on_complete(self):
    expected_tap = "this should be reached from first on complete"
    first_cmd_output = "command one completed"
    second_cmd = BashGradingScriptCommand(["echo", expected_tap], 1)
    first_cmd = BashGradingScriptCommand(f"echo {first_cmd_output}", 1, on_complete=second_cmd)

    output = first_cmd.execute([])
    responses, exceptions, tap_output = output.get_command_responses(), \
        output.get_execution_errors(), output.get_tap_output()

    self.assertEqual(len(exceptions), 0)
    self.assertEqual(tap_output, expected_tap)

    for response in responses:
      self.assertEqual(response.get_stderr_output(), "")
    self.assertEqual(responses[0].get_stdout_output(), first_cmd_output)
    self.assertEqual(responses[1].get_stdout_output(), expected_tap)
  
  def test_bash_command_working_dir(self):
    expected_tap = os.path.abspath('../')
    cmd = BashGradingScriptCommand(["pwd"], 1, working_dir="../")
    output = cmd.execute([])
    tap_output = output.get_tap_output()
    self.assertEqual(tap_output, expected_tap)
