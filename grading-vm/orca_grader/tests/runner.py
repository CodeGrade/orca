import unittest

# Import test case modules
import orca_grader.tests.container.build_script.test_cycle_detector as test_cycle_detector
import orca_grader.tests.container.grading_script.test_bash_grading_script_command as test_bash_grading_script_command
import orca_grader.tests.container.grading_script.test_conditional_grading_script_command as test_conditional_grading_script_command
import orca_grader.tests.container.build_script.code_file.test_code_file_info as test_code_file_info
import orca_grader.tests.container.build_script.code_file.test_code_file_processor as test_code_file_processor

if __name__ == '__main__':
  loader = unittest.TestLoader()
  suite = unittest.TestSuite()
  # Load Test Cases
  suite.addTests(loader.loadTestsFromModule(test_cycle_detector))
  suite.addTests(loader.loadTestsFromModule(test_bash_grading_script_command))
  suite.addTests(loader.loadTestsFromModule(test_conditional_grading_script_command))
  suite.addTests(loader.loadTestsFromModule(test_code_file_info))
  suite.addTests(loader.loadTestsFromModule(test_code_file_processor))
  runner = unittest.TextTestRunner(verbosity=3)
  runner.run(suite)
