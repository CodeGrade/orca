ConditionalGradingScriptCommandSchema = {
  "type": "object",
  "properties": {
    "condition": { 
      "$ref": "validations/schemas/grading_script_condition_schema.py" 
    },
    "on_true": { "type": ["string", "number"] },
    "on_false": { "type": ["string", "number"] }
  },
  "required": ["cmd", "on_complete", "on_fail"]
}