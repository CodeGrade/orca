import unittest

# Import test case modules
import orca_grader.tests.container.build_script.test_cycle_detector as test_cycle_detector
import orca_grader.tests.container.grading_script.test_bash_grading_script_command as test_bash_grading_script_command

if __name__ == '__main__':
  loader = unittest.TestLoader()
  suite = unittest.TestSuite()
  # Load Test Cases
  suite.addTests(loader.loadTestsFromModule(test_cycle_detector))
  suite.addTests(loader.loadTestsFromModule(test_bash_grading_script_command))
  runner = unittest.TextTestRunner(verbosity=3)
  runner.run(suite)
