BashGradingScriptCommandSchema = {
  "type": "object",
  "properties": {
    "cmd": { "type": "string" },
    "on_complete": { "type": ["string", "number"] },
    "on_fail": { "type": ["string", "number"] }
  },
  "required": ["cmd", "on_complete", "on_fail"]
}