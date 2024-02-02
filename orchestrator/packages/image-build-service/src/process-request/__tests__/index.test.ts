import { existsSync, mkdirSync, rmSync } from "fs";
import { createAndStoreGraderImage } from "..";
import path from "path";
import { getConfig, GraderImageBuildRequest } from "@codegrade-orca/common";

const CONFIG = getConfig();

describe("grader image functionality", () => {
  const graderImageBuildReq: GraderImageBuildRequest = {
    dockerfileContents: `FROM hello-world
    `,
    dockerfileSHASum: "generated-sha-sum",
  };

  beforeAll(() => {
    if (!existsSync(CONFIG.dockerImageFolder)) {
      mkdirSync(CONFIG.dockerImageFolder);
    }
  });

  afterAll(() => {
    rmSync(
      path.join(
        CONFIG.dockerImageFolder,
        `${graderImageBuildReq.dockerfileSHASum}.tgz`,
      ),
      {
        force: true,
        recursive: true,
      },
    );
  });

  it("successfully creates a grader image", async () => {
    await createAndStoreGraderImage(graderImageBuildReq);
    expect(
      existsSync(
        path.join(
          CONFIG.dockerImageFolder,
          `${graderImageBuildReq.dockerfileSHASum}.Dockerfile`,
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.join(
          path.join(
            CONFIG.dockerImageFolder,
            `${graderImageBuildReq.dockerfileSHASum}.tgz`,
          ),
        ),
      ),
    ).toBe(true);
  }, 10000);
});
