import { GraderImageBuildRequest } from "../../types/image-build-service";

export const defaultGraderImageBuildRequest: GraderImageBuildRequest = {
  dockerfile_contents: `FROM hello-world:latest`,
  dockerfile_sha_sum: "generated-sha-sum",
  response_url: "http://example.com/response",
};
