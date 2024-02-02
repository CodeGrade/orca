import { GraderImageBuildRequest } from "@codegrade-orca/common";

export const defaultGraderImageBuildRequest: GraderImageBuildRequest = {
  dockerfileContents: `FROM hello-world:latest`,
  dockerfileSHASum: "generated-sha-sum",
};
