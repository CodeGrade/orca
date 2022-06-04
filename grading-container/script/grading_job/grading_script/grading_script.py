from typing import Dict, List
from audit import Audit
from grading_job.grading_job_output import GradingJobOutput
from grading_job.grading_script.grading_script_command import GradingScriptCommand
from grading_job.grading_script.grading_script_command_response import GradingScriptCommandResponse

OUTPUT = "output"
ABORT = "abort"

# TODO: Add files for student code, starter code(?), professor code(?) (tests).
class GradingScript:  
  def __init__(self, cmds: List[GradingScriptCommand], max_retries: int) -> None:
    self.__cmds: List[GradingScriptCommand] = cmds
    self.__num_retries = 0
    self.__max_retries = max_retries
    
  # TODO: This should probably be a while loop where we can navigate 
  # back to a previous/future command (i.e., onComplete and onAbort logic)
  # TODO: How to handle interpolated strings (i.e. \"$ASSETS\")?
  def execute_script(self, audit: Audit, grade_id: int, submission_id: int, 
    interpolated_dirs: Dict[str, str]) -> GradingJobOutput:
    self.__update_commands_with_interpolated_paths(interpolated_dirs)
    errors = []
    num_commands = len(self.__cmds)
    current_cmd_ind = 0
    while current_cmd_ind != num_commands:
      cmd = self.__cmds[current_cmd_ind]
      #  TODO: 1. Replace any iterpolated strings for file locations.
      audit.log_details(f"Running command \"{cmd.get_command_string()}\"")
      # 2. Execute the command.
      cmd_output = cmd.exec_cmd()
      # 3. Based on the result of the command, log the proper details
      # to the Audit and append errors to list.
      if cmd_output.did_time_out():
        audit.log_details("Script timed out while attempting to execute this command.")
        errors.append(f"Command {cmd.get_command_string()} timed out.")
      elif cmd_output.is_error():
        audit.log_details(f"Command failed with status code {cmd_output.get_status_code()}.")
        errors.append(f"Command {cmd.get_command_string()} failed with status code " \
          f"{cmd_output.get_status_code()}")
      else:
        audit.log_details("Command executed successfully.")
      did_complete = not cmd_output.is_error()
      script_next = cmd_output.get_next()
      # 4. Navigate to the next command based on the command's on_fail or on_complete.
      # If the maximum number of retries has been met, then abort for the next on_fail.
      if did_complete and script_next == OUTPUT:
        return GradingJobOutput(grade_id, submission_id, cmd_output.get_output(), errors)
      elif script_next == ABORT:
        audit.log_details("Script execution was aborted.")
        return GradingJobOutput
      elif not did_complete and (self.__num_retries == self.__max_retries):
        audit.log_details("The script has reached the maxiumum number of retries allowed. "\
          "Execution has been stopped.")
        return GradingJobOutput(grade_id, submission_id, cmd_output.get_output(), errors)
      
      current_cmd_ind = int(script_next)
      if not did_complete:
        self.__num_retries += 1

  def set_max_retries(self, max_retries: int) -> None:
    self.__max_retries = max_retries
  
  def get_max_retries(self) -> int:
    return self.__max_retries
  
  def __update_commands_with_interpolated_paths(self, interpolated_dirs: Dict[str, str]) -> None:
    for cmd in self.__cmds:
      cmd.replace_interpolated_dirs(interpolated_dirs)