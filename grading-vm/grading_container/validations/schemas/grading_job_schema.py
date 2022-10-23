GradingJobSchema = {
  "type": "object",
  "properties": {
    "submission_id": { "type": "integer" },
    "grade_id": { "type": "integer" },
    "grader_id": { "type": "integer"},
    "course_id": { "type": "integer"},
    "target_code": { "$ref": "validations/schemas/code_file_schema.py" },
    "fixture_code": { "$ref": "validations/schemas/code_file_schema.py" },
    "test_code": { "$ref": "validations/schemas/code_file_schema.py" },
    "script": {
      "type": "array",
      "items": {
        "oneOf": [
          { "$ref": "validations/schemas/bash_grading_script_command_schema.py" },
          { "$ref": "validations/schemas/conditional_grading_script_comamnd_schema.py" }
        ]
      }
    },
    "team_id": { "type": "integer" },
    "user_id": { "type": "integer" },
    "user_names": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "submitter_name": {"type": "string"}
  },
  "required": ["submission_id", "grade_id", "grader_id", "course_id", "target_code", "priority", "script", "submitter_name"]
}