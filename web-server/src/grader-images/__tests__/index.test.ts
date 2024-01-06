import { existsSync, rmSync } from "fs";
import { DOCKER_IMAGE_FILE_LOCATION, createAndStoreGraderImage } from "..";
import { GraderImageBuildRequest } from "../types";
import path from "path";

describe("grader image functionality", () => {
  const graderImageBuildReq: GraderImageBuildRequest = {
    dockerfileContents: `FROM hello-world
    `,
    dockerfileSHASum: "generated-sha-sum",
  };
  const graderImagePath = path.join(
    DOCKER_IMAGE_FILE_LOCATION,
    graderImageBuildReq.dockerfileSHASum,
  );

  afterAll(() => {
    rmSync(graderImagePath, {
      force: true,
      recursive: true,
    });
  });

  it("successfully creates a grader image", async () => {
    await createAndStoreGraderImage(graderImageBuildReq);
    expect(
      existsSync(
        path.join(
          graderImagePath,
          `${graderImageBuildReq.dockerfileSHASum}.Dockerfile`,
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        path.join(
          path.join(
            graderImagePath,
            `${graderImageBuildReq.dockerfileSHASum}.tgz`,
          ),
        ),
      ),
    ).toBe(true);
  });
});
