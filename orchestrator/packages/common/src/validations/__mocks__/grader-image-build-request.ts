import { GraderImageBuildRequest } from "../../types/image-build-service";

export const defaultGraderImageBuildRequest: GraderImageBuildRequest = {
  dockerfileContents: `FROM hello-world:latest`,
  dockerfileSHASum: "generated-sha-sum",
};
