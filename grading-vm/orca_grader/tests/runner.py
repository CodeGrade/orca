import unittest

# Import test case modules
import orca_grader.tests.container.build_script.test_cycle_detector as test_cycle_detector


if __name__ == '__main__':
  loader = unittest.TestLoader()
  suite = unittest.TestSuite()
  # Load Test Cases
  suite.addTests(loader.loadTestsFromModule(test_cycle_detector))
  runner = unittest.TextTestRunner(verbosity=3)
  runner.run(suite)
