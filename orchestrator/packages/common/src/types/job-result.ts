export interface GradingJobResult {
  shell_responses: Array<GradingScriptCommandResponse>,
  errors: Array<string>,
  output?: string
}

interface GradingScriptCommandResponse {
  cmd: string | Array<string>,
  stdout: string,
  stderr: string,
  did_timeout: boolean,
  is_error: boolean,
  status_code: number
}
