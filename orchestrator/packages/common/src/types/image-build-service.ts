export interface GraderImageBuildResult {
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

export interface GraderImageBuildRequest {
  dockerfileContents: string;
  dockerfileSHASum: string;
  responseURL: string;
}
