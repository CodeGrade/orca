from unittest import TestCase
from orca_grader.common.grading_job.grading_job_result import GradingJobResult
from orca_grader.container.grading_script.grading_script_command_response import \
    GradingScriptCommandResponse


class TestGradingJobResult(TestCase):

    def setUp(self):
        default_params = {
            "is_error": False,
            "cmd": ["echo", "hello"],
            "stdout_output": "hello",
            "stderr_output": "",
            "status_code": 0,
        }
        self.__responses = [
            GradingScriptCommandResponse(**default_params),
            GradingScriptCommandResponse(
                **{
                    **default_params,
                    "stdout_output": "build_dir/plus_more/file.txt"
                }
            )
        ]
        self.__reversed_dirs = {"build_dir/plus_more": "$BUILD"}

    def test_result_without_interpolated_dirs(self):
        result = GradingJobResult(command_responses=self.__responses)
        second_response = result.to_json()[1]
        self.assertFalse("$BUILD" in second_response)

    def test_result_with_interpolated_dirs(self):
        result = GradingJobResult(command_responses=self.__responses)
        second_response = result.to_json(
            interpolated_dirs=self.__reversed_dirs)[1]
        self.assertTrue("$BUILD" in second_response)
