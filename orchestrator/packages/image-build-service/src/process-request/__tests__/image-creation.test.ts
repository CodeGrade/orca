import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { getConfig, GraderImageBuildRequest } from "@codegrade-orca/common";
import { createAndStoreGraderImage } from "../image-creation";

const CONFIG = getConfig();

describe("grader image functionality", () => {
  const graderImageBuildReq: GraderImageBuildRequest = {
    dockerfile_contents: `FROM hello-world`,
    dockerfile_sha_sum: "generated-sha-sum",
    response_url: "http://example.com/response",
    build_key: "{\"grader_id\": 1}"
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
        `${graderImageBuildReq.dockerfile_sha_sum}.tgz`,
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
          `${graderImageBuildReq.dockerfile_sha_sum}.Dockerfile`,
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.join(
          path.join(
            CONFIG.dockerImageFolder,
            `${graderImageBuildReq.dockerfile_sha_sum}.tgz`,
          ),
        ),
      ),
    ).toBe(true);
  }, 10000);
});
