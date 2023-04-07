from typing import Dict, List, Literal, Tuple
import os
from orca_grader.container.build_script.code_file.code_file_info import CodeFileInfo
from orca_grader.container.build_script.code_file.processing.code_file_processor import CodeFileProcessor
from orca_grader.container.build_script.cycle_detector import CycleDetector
from orca_grader.container.build_script.exceptions import InvalidGradingScriptCommand, NotADAGException
from orca_grader.container.grading_script.bash_grading_script_command import BashGradingScriptCommand
from orca_grader.container.grading_script.conditional_grading_script_command import ConditionalGradingScriptCommand, GradingScriptPredicate
from orca_grader.container.grading_script.grading_script_command import GradingScriptCommand
from orca_grader.container.build_script.json_helpers.grading_script_command import is_bash_command, is_conditional_command
from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON

DEFAULT_COMMAND_TIMEOUT = 60 # 1 minute

def _generate_label_to_index_hash(commands: List[GradingScriptCommandJSON]) -> Dict[str, int]:
  label_to_index = dict()
  for i in range(len(commands)):
    cmd = commands[i]
    if "label" in cmd:
      label_to_index[cmd["label"]] = i
  return label_to_index

class GradingScriptPreprocessor:

  def __init__(self, secret: str, json_cmds: List[GradingScriptCommandJSON], 
    code_files: Dict[str, CodeFileInfo], code_file_processor: CodeFileProcessor, 
    cmd_timeout: int = DEFAULT_COMMAND_TIMEOUT) -> None:
    if CycleDetector.contains_cycle(json_cmds):
      raise NotADAGException()
    self.__interpolated_dirs = {
      "$DOWNLOADED": f"{secret}/downloaded",
      "$EXTRACTED": f"{secret}/extracted",
      "$BUILD": f"{secret}/build"
    }
    self.__code_file_processor = code_file_processor
    self.__json_cmds = json_cmds
    self.__cmd_label_to_index = _generate_label_to_index_hash(json_cmds)
    self.__code_files = code_files
    self.__cmds = [None for _ in range(len(json_cmds))]
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
    for name, code_file in self.__code_files.items():
      file_download_dir = os.path.join(download_dir, name)
      file_extract_dir = os.path.join(extract_dir, name)
      self.__code_file_processor.process_file(code_file, file_download_dir, 
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
    shell_cmd: str | List[str] = self.__add_interpolated_paths(json_command["cmd"])
    on_fail, on_complete = self.__handle_bash_cmd_edges(json_command, index)
    working_dir = self.__add_interpolated_paths(json_command["working_dir"]) if "working_dir" in json_command else None
    if on_fail == "abort" and on_complete == "output":
      cmd = BashGradingScriptCommand(shell_cmd, self.__cmd_timeout, working_dir=working_dir)
    elif on_fail == "abort":
      cmd = BashGradingScriptCommand(shell_cmd, self.__cmd_timeout,
        on_complete=self.__get_grading_command_by_index(on_complete),
        working_dir=working_dir)
    elif on_complete == "output": 
      cmd = BashGradingScriptCommand(shell_cmd, self.__cmd_timeout, 
        on_fail=self.__get_grading_command_by_index(on_fail),
        working_dir=working_dir)
    else:
      cmd = BashGradingScriptCommand(shell_cmd, self.__cmd_timeout, 
        self.__get_grading_command_by_index(on_complete), 
        self.__get_grading_command_by_index(on_fail),
        working_dir=working_dir)
    self.__cmds[index] = cmd
    return cmd
  
  def __handle_bash_cmd_edges(self, bash_cmd: GradingScriptCommandJSON, current_index: int) \
    -> Tuple[int | Literal["abort"], int | Literal["output"]]:
    """
    Returns a Tuple in the order of (on_fail edge, on_complete edge).
    """
    # Handle on_fail
    if "on_fail" not in bash_cmd or bash_cmd["on_fail"] == "abort":
      on_fail = "abort"
    elif bash_cmd["on_fail"] == "next":
      on_fail = current_index + 1
    else:
      on_fail = self.__edge_to_index(bash_cmd["on_fail"])
    # Handle on_complete
    if "on_complete" not in bash_cmd or bash_cmd["on_complete"] == "next":
      on_complete = current_index + 1
    elif bash_cmd["on_complete"] != "output":
      on_complete = self.__edge_to_index(bash_cmd["on_complete"])
    else:
      on_complete = bash_cmd["on_complete"]
    return on_fail, on_complete
  
  def __process_conditional_command_json(self, json_command: GradingScriptCommandJSON, index: int):
    conditional: Dict[str, str] = json_command["condition"]
    predicate: GradingScriptPredicate = GradingScriptPredicate(conditional["predicate"])
    fs_path: str = self.__add_interpolated_paths(conditional["path"])
    on_false, on_true = self.__handle_conditional_command_edges(json_command, index)
    cmd: ConditionalGradingScriptCommand = ConditionalGradingScriptCommand(self.__get_grading_command_by_index(on_true), 
      self.__get_grading_command_by_index(on_false), fs_path, predicate)
    self.__cmds[index] = cmd
    return cmd

  def __handle_conditional_command_edges(self, cond_cmd: GradingScriptCommandJSON, current_index: int) \
    -> Tuple[int, int]:
    """
    Returns a Tuple in the order of (on_false edge, on_true edge).
    """
    go_to_next = lambda edge_key: edge_key not in cond_cmd or cond_cmd[edge_key] == "next"
    handle_cond_edge = lambda edge_key: current_index + 1 if go_to_next(edge_key) \
      else self.__edge_to_index(cond_cmd[edge_key])
    return handle_cond_edge("on_false"), handle_cond_edge("on_true")

  def __edge_to_index(self, edge: str | int) -> int:
    try:
      return edge if type(edge) == int else self.__cmd_label_to_index[edge]
    except KeyError as ke:
      raise InvalidGradingScriptCommand("The provided edge for one of the commands is a non-existing label.")
    except IndexError as ie:
      raise InvalidGradingScriptCommand("The provided edge for one of the commands points to an out-of-bounds index.")
  
  def __add_interpolated_paths(self, cmd: str | List[str]) -> str | List[str]:
    formatted_cmd = cmd
    for var in self.__interpolated_dirs:
      formatted_cmd = formatted_cmd.replace(var, self.__interpolated_dirs[var]) if type(cmd) == str \
        else list(map(lambda prog_arg: prog_arg.replace(var, self.__interpolated_dirs[var]), formatted_cmd))
    return formatted_cmd
  
  def __create_script_dirs(self) -> None:
    for item in self.__interpolated_dirs.items():
      path_var, dir = item
      os.makedirs(dir, exist_ok=(path_var == "$ASSETS")) # If the download, extract, or build dir already exists, something has gone very wrong...
