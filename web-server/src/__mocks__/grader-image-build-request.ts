import { GraderImageBuildRequest } from "../grader-images/types";

export const defaultGraderImageBuildRequest: GraderImageBuildRequest = {
  dockerfileContents: `FROM hello-world:latest`,
  dockerfileSHASum: "generated-sha-sum",
};
