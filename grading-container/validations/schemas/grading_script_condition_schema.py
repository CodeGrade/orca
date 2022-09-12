GradingScriptConditionSchema = {
  "type": "object",
  "properties": {
    "predicate": {
      "type": "string",
      "enum": ["exists", "file", "dir"]
    },
    "path": {
      "type": "string"
    }
  }
}