from typing import Dict, List
from grading_job.build_script.code_file.code_file_info import CodeFileInfo
from grading_job.build_script.exceptions import InvalidGradingScriptCommand
from grading_job.grading_script.bash_grading_script_command import BashGradingScriptCommand
from grading_job.grading_script.conditional_grading_script_command import ConditionalGradingScriptCommand, GradingScriptPredicate
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from validations.grading_job_json_types import CodeFileInfoJSON, GradingScriptCommandJSON

class GradingScriptPreprocessor:

  # TODO: CodeFileInfo will be a JSON.
  def __init__(self, secret: str, json_cmds: List[GradingScriptCommandJSON], 
    json_code_files: List[CodeFileInfoJSON], cmd_timeout: int) -> None:
    self.__interpolated_dirs = {
      "$ASSETS": "/assets",
      "$DOWNLOADED": f"{secret}_downloaded",
      "$EXTRACTED": f"{secret}_extracted",
      "$BUILD": f"{secret}_build"
    }
    self.__json_cmds = json_cmds
    self.__cmds = [None for _ in range(len(json_cmds))]
    self.__cmd_timeout = cmd_timeout
    
  def process_job(self) -> GradingScriptCommand:
    """
    """
    pass

  def __download_and_process_code_files(self, code_files: List[CodeFileInfo]) -> None:
    """
    Given a list of CodeFileInfo objects, download and extract (if necessary) each one.
    """
    pass

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

  def __process_bash_command_json(self, json: GradingScriptCommandJSON, index: int) -> GradingScriptCommand:
    bash_cmd: str = self.__add_interpolated_paths(json["cmd"])
    if json["on_fail"] == "abort" and json["on_complete"] == "output":
      cmd = BashGradingScriptCommand(bash_cmd, timeout=self.__cmd_timeout)
    elif json["on_fail"] == "abort":
      cmd = BashGradingScriptCommand(bash_cmd, 
        on_complete=self.__get_grading_command_by_index(json["on_complete"]), 
        timeout=self.__cmd_timeout)
    elif json["on_complete"] == "output": 
      cmd = BashGradingScriptCommand(bash_cmd, on_fail=self.__get_grading_command_by_index(json["on_fail"]), 
        timeout=self.__cmd_timeout)
    else:
      cmd = BashGradingScriptCommand(bash_cmd, self.__get_grading_command_by_index())
    self.__cmds[index] = cmd
    return cmd
  
  def __process_conditional_command_json(self, json: GradingScriptCommandJSON, index: int):
    conditional: Dict[str, str] = json["conditional"]
    predicate: GradingScriptPredicate = GradingScriptPredicate(conditional["predicate"])
    fs_path: str = self.__add_interpolated_paths(conditional["path"])
    cmd: ConditionalGradingScriptCommand = ConditionalGradingScriptCommand(self.__get_grading_command_by_index(json["on_true"]), 
      self.__get_grading_command_by_index(json["on_false"]), fs_path, predicate)
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