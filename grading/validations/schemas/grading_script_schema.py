GRADING_JOB_SCHEMA = {
  "type": "object",
  "properties": {
    "student_code": { "type": "string" },
    "starter_code": { "type": "string" },
    "professor_code": { "type": "string" },
    "commands": {
      "type": "array",
      "items": {
        "$ref": "/validations/schemas/grading_script_command_schema.py" 
      }
    }
  }
}