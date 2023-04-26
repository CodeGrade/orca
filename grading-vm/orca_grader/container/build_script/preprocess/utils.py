from typing import Dict, List, Optional
from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON
from orca_grader.container.build_script.exceptions import InvalidGradingScriptCommand
from orca_grader.container.build_script.json_helpers.grading_script_command import RESERVED_KEYWORDS

def _render_next_labels_as_numeric_indices(commands: List[GradingScriptCommandJSON]) -> None:
  for i in range(len(commands)):
    command = commands[i]
    for key in list(filter(lambda k: k.startswith('on_'), list(command.keys()))):
      if type(command[key]) == str and command[key] == 'next':
        command[key] = i + 1

def _is_replaceable_str_edge(command: GradingScriptCommandJSON, edge_key: str) -> bool:
  return type(command[edge_key]) == str and command[edge_key] not in RESERVED_KEYWORDS

def _generate_label_to_index_hash(commands: List[GradingScriptCommandJSON]) -> Dict[str, int]:
  label_to_index = dict()
  for i in range(len(commands)):
    cmd = commands[i]
    if "label" in cmd:
      if cmd["label"] in label_to_index:
        raise InvalidGradingScriptCommand(f"This command contains the already used label {cmd['label']}.")
      label_to_index[cmd["label"]] = i
  return label_to_index

def _convert_labels_into_indices(commands: List[GradingScriptCommandJSON]) -> None:
  label_to_index = _generate_label_to_index_hash(commands)
  for i in range(len(commands)):
    command = commands[i]
    for key in command:
      if key.startswith('on_') and _is_replaceable_str_edge(command, key):
        command[key] = label_to_index[command[key]]

def flatten_grading_script(commands: List[GradingScriptCommandJSON], 
                           parent_offset: Optional[int] = None) -> List[GradingScriptCommandJSON]:
  flattened_script, offset = list(), 0
  _render_next_labels_as_numeric_indices(commands)
  for i in range(len(commands)):
    current = commands[i]
    flattened_subscript = []
    for key in current.keys():
      if key.startswith('on_') and type(current[key]) == list:
        subscript_parent_offset = offset + i + 1 + (parent_offset or 0)
        flattened_subscript.extend(flatten_grading_script(current[key], subscript_parent_offset))
        current[key] = subscript_parent_offset
        offset += len(flattened_subscript)
      elif key.startswith('on_') and type(current[key]) == int:
        current[key] = current[key] + parent_offset + offset if parent_offset is not None \
          else current[key] + offset
    flattened_script.append(current)
    flattened_script.extend(flattened_subscript)
  if parent_offset is None:
    _convert_labels_into_indices(flattened_script)
  return flattened_script