from typing import Dict, List
import os
from grading_job.build_script.code_file.code_file_info import CodeFileInfo, json_to_code_file_info
from grading_job.build_script.code_file.processing.code_file_processing_strategy import CodeFileProcessor
from grading_job.build_script.exceptions import InvalidGradingScriptCommand
from grading_job.grading_script.bash_grading_script_command import BashGradingScriptCommand
from grading_job.grading_script.conditional_grading_script_command import ConditionalGradingScriptCommand, GradingScriptPredicate
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from validations.grading_job_json_types import CodeFileInfoJSON, GradingScriptCommandJSON

DEFAULT_COMMAND_TIMEOUT = 60 # 1 minute

class GradingScriptPreprocessor:

  def __init__(self, secret: str, json_cmds: List[GradingScriptCommandJSON], 
    code_files: Dict[CodeFileInfo], file_processor: CodeFileProcessor, 
    cmd_timeout: int = DEFAULT_COMMAND_TIMEOUT) -> None:
    self.__interpolated_dirs = {
      "$ASSETS": "/assets",
      "$DOWNLOADED": f"{secret}/downloaded",
      "$EXTRACTED": f"{secret}/extracted",
      "$BUILD": f"{secret}/build"
    }
    self.__file_processing_command = file_processor
    self.__json_cmds = json_cmds
    self.__code_files = code_files
    self.__cmds = [None for _ in range(len(json_cmds))]
    self.__cmd_timeout = cmd_timeout
    
  def preprocess_job(self) -> GradingScriptCommand:
    # TODO: Add CodeFile logic.
    self.__download_and_process_code_files()
    script = self.__generate_grading_script()
    return script

  def __download_and_process_code_files(self) -> None:
    """
    Given a list of CodeFileInfo objects, download and extract (if necessary) each one.
    """
    for item in self.__interpolated_dirs.items():
      _, dir = item
      if not os.path.exists(dir):
        os.makedirs(dir)
    for code_file in self.__code_files:
      self.__file_processing_command.process_file(code_file, self.__interpolated_dirs["$DOWNLOADED"], 
        self.__interpolated_dirs["EXTRACTED"])

  def __generate_grading_script(self):
    for i in range(len(self.__cmds)):
      if self.__cmds[i] is None:
        self.__get_grading_command_by_index(i)
      else:
        continue
    # TODO: Add check(s) for cycle (aka ensure DAG).
    return self.__cmds[0]

  def __get_grading_command_by_index(self, index: int) -> GradingScriptCommand:
    if self.__cmds[index] is not None:
      return self.__cmds[index]
    if self.__is_bash_command_json(self.__json_cmds[index]):
      return self.__process_bash_command_json(self.__json_cmds[index], index)
    elif self.__is_conditional_command_json(self.__json_cmds[index], index):
      return self.__process_conditional_command_json(self.__json_cmds[index], index)
    else:
      raise InvalidGradingScriptCommand()

  def __process_bash_command_json(self, json_command: GradingScriptCommandJSON, index: int) -> GradingScriptCommand:
    bash_cmd: str = self.__add_interpolated_paths(json_command["cmd"])
    if json_command["on_fail"] == "abort" and json_command["on_complete"] == "output":
      cmd = BashGradingScriptCommand(bash_cmd, self.__cmd_timeout)
    elif json_command["on_fail"] == "abort":
      cmd = BashGradingScriptCommand(bash_cmd, self.__cmd_timeout,
        on_complete=self.__get_grading_command_by_index(json_command["on_complete"]))
    elif json_command["on_complete"] == "output": 
      cmd = BashGradingScriptCommand(bash_cmd, self.__cmd_timeout, 
        on_fail=self.__get_grading_command_by_index(json_command["on_fail"]))
    else:
      cmd = BashGradingScriptCommand(bash_cmd, self.__cmd_timeout, 
        self.__get_grading_command_by_index(json_command["on_complete"]), 
        self.__get_grading_command_by_index(json_command["on_fail"]))
    self.__cmds[index] = cmd
    return cmd
  
  def __process_conditional_command_json(self, json_command: GradingScriptCommandJSON, index: int):
    conditional: Dict[str, str] = json_command["conditional"]
    predicate: GradingScriptPredicate = GradingScriptPredicate(conditional["predicate"])
    fs_path: str = self.__add_interpolated_paths(conditional["path"])
    cmd: ConditionalGradingScriptCommand = ConditionalGradingScriptCommand(self.__get_grading_command_by_index(json_command["on_true"]), 
      self.__get_grading_command_by_index(json_command["on_false"]), fs_path, predicate)
    self.__cmds[index] = cmd
    return cmd
  
  def __is_conditional_command_json(self, json: GradingScriptCommandJSON):
    return "on_false" in json and "on_true" in json and "condition" in json
  
  def __is_bash_command_json(self, json: GradingScriptCommandJSON):
    return "on_fail" in json and "on_complete" in json and "cmd" in json
  
  def __add_interpolated_paths(self, cmd: str):
    formatted_cmd = cmd
    for var in self.__interpolated_dirs:
      formatted_cmd = formatted_cmd.replace(var, self.__interpolated_dirs[var])
    return formatted_cmd