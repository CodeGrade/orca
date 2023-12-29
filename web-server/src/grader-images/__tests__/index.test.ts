import { existsSync, rmSync } from "fs";
import { DOCKER_IMAGE_FILE_LOCATION, createGraderImage } from "..";
import { GraderImageBuildRequest } from "../types";
import path from "path";

describe("grader image functionality", () => {
  const graderImageBuildReq: GraderImageBuildRequest = {
    dockerfileContent: `FROM hello-world
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
    await createGraderImage(graderImageBuildReq);
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
            DOCKER_IMAGE_FILE_LOCATION,
            `${graderImageBuildReq.dockerfileSHASum}.tgz`,
          ),
        ),
      ),
    ).toBe(true);
  });
});
