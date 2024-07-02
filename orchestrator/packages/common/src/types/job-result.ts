export interface GraderImageBuildResult {
  type: "GraderImageBuildResult",
  build_logs: Array<ImageBuildLog>,
  was_successful: boolean
  server_exception?: string,
  dockerfile_sha_sum: string
}

export interface ImageBuildFailure {
  error: Error,
  logs: Array<ImageBuildLog>,
};

export type ImageBuildStep = "Write request contents to Dockerfile." |
  "Run docker build on Dockerfile." |
  "Save image to .tgz file." |
  "Remove residual Dockerfile.";

export interface ImageBuildLog {
  step: ImageBuildStep,
  cmd?: string | Array<string>,
  stderr: string
}

export const isImageBuildFailure = (object: unknown): object is ImageBuildFailure => {
  return !!object && typeof object === "object" && "error" in object && "logs" in object;
}

export interface GradingJobResult {
  type: "GradingJobResult",
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
