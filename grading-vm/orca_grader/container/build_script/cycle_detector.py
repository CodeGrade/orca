from functools import reduce
from typing import Dict, List, Set, Tuple
from orca_grader.container.build_script.json_helpers.grading_script_command import is_conditional_command
from orca_grader.common.types.grading_job_json_types import GradingScriptCommandJSON

class CycleDetector:

  @staticmethod
  def contains_cycle(json_script: List[GradingScriptCommandJSON]):
    """
    Given a list of GradingScriptCommandJSON, apply Kosaraju's algorithm
    to determine if a graph generated by the commands contains a cycle.
    """
    # Check for self-referential commands (i.e., on_* points to same command)
    for i in range(len(json_script)):
      json_command = json_script[i]
      if CycleDetector.cmd_has_self_ref(json_command, i):
        return True
    
    # Create G and G_reversed (in the form of adjacency lists using command list indices).
    adj_list, rev_adj_list = CycleDetector.generate_adjacency_lists_from_script(json_script)

    # First DFS Iteration:
    visited = set()
    command_stack = list()
    for vertex in adj_list:
      CycleDetector.visit_command(vertex, adj_list, visited, command_stack)

    # Second DFS Iteration and counting of Strongly Connected Components:
    visited.clear()
    num_scc = 0
    while len(command_stack) > 0:
      vertex = command_stack.pop()
      if vertex not in visited:
        num_scc += 1
        CycleDetector.visit_command(vertex, rev_adj_list, visited)
  
    return num_scc != len(json_script)
  
  @staticmethod
  def generate_adjacency_lists_from_script(json_script: List[GradingScriptCommandJSON]) \
    -> Tuple[Dict[int, List[int]], Dict[int, List[int]]]:
    """
    Given a GradingScriptJSON, or a JSON representation of a graph/state machine of 
    GradingScriptCommands, return a pair with the original and reversed adjacency lists
    (using indices in the list), respectively.
    """
    adj_list = { i: [] for i in range(len(json_script))}
    rev_adj_list = { i: [] for i in range(len(json_script))}
    for i in range(len(json_script)):
      command = json_script[i]
      if is_conditional_command(command):
        CycleDetector.append_edges_to_adjacency_lists_conditional_command(command, i, adj_list, rev_adj_list)
      else:
        CycleDetector.append_edges_to_adjacency_lists_bash_command(command, i, adj_list, rev_adj_list)
    return adj_list, rev_adj_list
  
  @staticmethod
  def visit_command(vertex: int, adj_list: Dict[int, List[int]], visited: Set[int], 
    stack: List[int] = None) -> None:
    visited.add(vertex)
    for neighbor in adj_list[vertex]:
      if neighbor not in visited:
        CycleDetector.visit_command(vertex, adj_list, visited, stack)
    stack is not None and stack.append(vertex)
      
  @staticmethod
  def append_edges_to_adjacency_lists_conditional_command(command: GradingScriptCommandJSON, 
    index: int, adj_list: Dict[int, List[int]], rev_adj_list: Dict[int, List[int]]) -> None:
    if type(command["on_true"]) == int:
      adj_list[index].append(command["on_true"])
      rev_adj_list[command["on_true"]].append(index)
    if type(command["on_false"]) == int:
      adj_list[index].append(command["on_false"])
      rev_adj_list[command["on_false"]].append(index)
    
  @staticmethod
  def append_edges_to_adjacency_lists_bash_command(command: GradingScriptCommandJSON, index: int, 
    adj_list: Dict[int, List[int]], rev_adj_list: Dict[int, List[int]]) -> None:
    if type(command["on_complete"]) == int:
      adj_list[index].append(command["on_complete"])
      rev_adj_list[command["on_complete"]].append(index)
    if type(command["on_fail"]) == int:
      adj_list[index].append(command["on_fail"])
      rev_adj_list[command["on_fail"]].append(index)

  @staticmethod
  def cmd_has_self_ref(json_command: GradingScriptCommandJSON, index: int) -> bool:
    for item in json_command.items():
      k, v = item
      if "on_" in k and type(v) == int and v == index:
        return True
    return False
