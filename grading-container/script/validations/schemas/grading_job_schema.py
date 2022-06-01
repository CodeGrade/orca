# NOTE: While we don't actually end up "importing" or using team_id, user_id, 
# or priority, they are expected to (possibly, in the case of user and team IDs)
# exist in the shape of what is received from the Grading Queue.

GradingJobSchema = {
  "type": "object",
  "properties": {
    "submission_id": { "type": "integer" },
    "grade_id": { "type": "integer" },
    "student_code": { "type": "string" },
    "starter_code": { "type": "string" },
    "professor_code": { "type": "string" },
    "commands": {
      "type": "array",
      "items": {
        "$schema": "validations/schemas/grading_script_command_schema.py" 
      }
    },
    "max_retries": { "type": "integer" },
    "team_id": { "type": "integer" },
    "user_id": { "type": "integer" }
  },
  "required": ["submission_id", "grade_id", "student_code", "commands"]
}