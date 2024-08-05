export interface GraderImageBuildResult {
  was_successful: boolean,
  logs: Array<ImageBuildLog | string>
}

export type ImageBuildStep = "Write request contents to Dockerfile." |
  "Run docker build on Dockerfile." |
  "Save image to .tgz file." |
  "Remove Dockerfile.";

export interface ImageBuildLog {
  step: ImageBuildStep,
  output?: string,
  error?: string
}

export const isImageBuildResult = (o: unknown): o is GraderImageBuildResult => {
  if (typeof o !== "object" || o === null) return false;
  return Object.keys(o).length == 2 && ["was_successful", "logs"].every((k) => k in o);
}

export interface GraderImageBuildRequest {
  dockerfile_contents: string,
  dockerfile_sha_sum: string,
  response_url: string,
}
