# TODO: Add team and user id
GradingJobSchema = {
  "type": "object",
  "properties": {
    "submission_id": { "type": "string" },
    "grade_id": { "type": "string" },
    "student_code": { "type": "string" },
    "starter_code": { "type": "string" },
    "professor_code": { "type": "string" },
    "commands": {
      "type": "array",
      "items": {
        "$schema": "validations/schemas/grading_script_command_schema.py" 
      }
    }
  },
  "required": ["submission_id", "grade_id", "student_code", "commands"]
}