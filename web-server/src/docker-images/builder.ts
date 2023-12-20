import { execFile } from "child_process";
import { writeFile } from "fs/promises";
import { DockerImageBuildRequest } from "./types";
import { DockerImageBuildException } from "./exceptions";

export const buildDockerImageTGZ = async (
  buildReq: DockerImageBuildRequest,
) => {
  // TODO: What about a dockerfile that needs local files to be built?
  const dockerfilePath = await writeDockerfileContentsToFile(buildReq);
  await buildDockerImage(dockerfilePath, buildReq);
  await saveImageToTGZ(buildReq);
};

const saveImageToTGZ = ({ shaSum }: DockerImageBuildRequest) => {
  // TODO: Where should save location be?
  const saveLocation = `${shaSum}.tgz`;
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      ["save", "-o", saveLocation, shaSum],
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new DockerImageBuildException(
              `The following error was encountered while saving image for ${shaSum} to .tgz file: ${stderr}`,
            ),
          );
        }
        resolve(stdout);
      },
    );
  });
};

const buildDockerImage = (
  dockerfilePath: string,
  { shaSum }: DockerImageBuildRequest,
) => {
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      ["build", "-t", shaSum, "-f", dockerfilePath],
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new DockerImageBuildException(`The following error was encountered when attempting to build 
            the docker image for ${shaSum}: ${stderr}`),
          );
        }
        resolve(stdout);
      },
    );
  });
};

const writeDockerfileContentsToFile = async ({
  shaSum,
  dockerfileContents,
}: DockerImageBuildRequest) => {
  // TODO: Where should this file be saved to? E.g., use of project dir through node.
  const fileName = `${shaSum}.Dockerfile`;
  try {
    await writeFile(fileName, dockerfileContents);
    return fileName;
  } catch (error) {
    throw new DockerImageBuildException(
      "An error occurred while trying to create",
    );
  }
};
