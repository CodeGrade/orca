GRADING_SCRIPT_SCHEMA = {
  "type": "object",
  "properties": {
    "cmd": { "type": "string" },
    "on_complete": { "type": "string" },
    "on_fail": { "type": "string" }
  },
  "required": ["cmd", "on_complete", "on_fail"]
}