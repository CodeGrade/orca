from typing import Dict, List
import os
from orca_grader.container.build_script.file_info.file_info import FileInfo
from orca_grader.container.build_script.file_info.processing.file_processor import FileProcessor
from orca_grader.container.build_script.preprocess.cycle_detector import CycleDetector
from orca_grader.container.build_script.exceptions import InvalidGradingScriptCommand, NotADAGException
from orca_grader.container.build_script.preprocess.utils import flatten_grading_script
from orca_grader.container.grading_script.bash_grading_script_command import BashGradingScriptCommand
from orca_grader.container.grading_script.conditional_grading_script_command import ConditionalGradingScriptCommand, GradingScriptPredicate
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.build_script.json_helpers.grading_script_command import is_bash_command, is_conditional_command
from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON

DEFAULT_COMMAND_TIMEOUT = 60  # 1 minute


class GradingScriptPreprocessor:

    def __init__(self, secret: str, json_cmds: List[GradingScriptCommandJSON],
                 files: Dict[str, FileInfo], file_processor: FileProcessor,
                 cmd_timeout: int = DEFAULT_COMMAND_TIMEOUT) -> None:
        flattened_cmds = flatten_grading_script(json_cmds)
        if CycleDetector.contains_cycle(flattened_cmds):
            raise NotADAGException()
        self.__interpolated_dirs = {
            "$DOWNLOADED": os.path.abspath(f"{secret}/downloaded"),
            "$EXTRACTED": os.path.abspath(f"{secret}/extracted"),
            "$BUILD": os.path.abspath(f"{secret}/build")
        }
        self.__file_processor = file_processor
        self.__json_cmds = flattened_cmds
        self.__files = files
        self.__cmds = [None for _ in range(len(flattened_cmds))]
        self.__cmd_timeout = cmd_timeout

    def preprocess_job(self) -> GradingScriptCommand:
        self.__download_and_process_code_files()
        script = self.__generate_grading_script()
        return script

    def __download_and_process_code_files(self) -> None:
        """
        Given a list of CodeFileInfo objects, download and extract (if necessary) each one.
        """
        self.__create_script_dirs()
        download_dir = self.__interpolated_dirs["$DOWNLOADED"]
        extract_dir = self.__interpolated_dirs["$EXTRACTED"]
        for name, code_file in self.__files.items():
            file_download_dir = os.path.join(download_dir, name)
            file_extract_dir = os.path.join(extract_dir, name)
            self.__file_processor.process_file(code_file, file_download_dir,
                                                    file_extract_dir)

    def __generate_grading_script(self) -> GradingScriptCommand:
        for i in range(len(self.__cmds)):
            if self.__cmds[i] is None:
                self.__get_grading_command_by_index(i)
        return self.__cmds[0]

    def __get_grading_command_by_index(self, index: int) -> GradingScriptCommand:
        if self.__cmds[index] is not None:
            return self.__cmds[index]
        if is_bash_command(self.__json_cmds[index]):
            return self.__process_bash_command_json(self.__json_cmds[index], index)
        elif is_conditional_command(self.__json_cmds[index]):
            return self.__process_conditional_command_json(self.__json_cmds[index], index)
        else:
            raise InvalidGradingScriptCommand()

    def __process_bash_command_json(self, json_command: GradingScriptCommandJSON, index: int) -> GradingScriptCommand:
        shell_cmd: str | List[str] = self.__add_interpolated_paths(
            json_command["cmd"])
        on_fail, on_complete = json_command["on_fail"], json_command["on_complete"]
        working_dir = self.__add_interpolated_paths(
            json_command["working_dir"]) if "working_dir" in json_command else None
        cmd = BashGradingScriptCommand(shell_cmd,
                                       on_complete=self.__get_grading_command_by_index(
                                           on_complete) if on_complete != "output" else None,
                                       on_fail=self.__get_grading_command_by_index(
                                           on_fail) if on_fail != "abort" else None,
                                       timeout=json_command["timeout"] if "timeout" in json_command else self.__cmd_timeout,
                                       working_dir=working_dir)
        self.__cmds[index] = cmd
        return cmd

    def __process_conditional_command_json(self, json_command: GradingScriptCommandJSON, index: int):
        conditional: Dict[str, str] = json_command["condition"]
        predicate: GradingScriptPredicate = GradingScriptPredicate(
            conditional["predicate"])
        fs_path: str = self.__add_interpolated_paths(conditional["path"])
        on_false, on_true = json_command["on_false"], json_command["on_true"]
        cmd = ConditionalGradingScriptCommand(self.__get_grading_command_by_index(on_true),
                                              self.__get_grading_command_by_index(on_false), fs_path, predicate)
        self.__cmds[index] = cmd
        return cmd

    def __add_interpolated_paths(self, cmd: str | List[str]) -> str | List[str]:
        formatted_cmd = cmd
        for var in self.__interpolated_dirs:
            formatted_cmd = formatted_cmd.replace(var, self.__interpolated_dirs[var]) if type(cmd) == str \
                else list(map(lambda prog_arg: prog_arg.replace(var, self.__interpolated_dirs[var]), formatted_cmd))
        return formatted_cmd

    def __create_script_dirs(self) -> None:
        for item in self.__interpolated_dirs.items():
            path_var, dir = item
            # If the download, extract, or build dir already exists, something has gone very wrong...
            os.makedirs(dir, exist_ok=(path_var == "$ASSETS"))
