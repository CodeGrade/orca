import path from "path";
import { redisDel, redisSet } from "../redis";
import { writeFile } from "fs/promises";
import { spawn } from "child_process";
import { clearOutDockerQueues } from "../../grading-queue/docker-handler";

const createRedisKey = async (dockerfileSHA: string) => {
  const [_, error] = await redisSet(dockerfileSHA, dockerfileSHA);
  if (error) {
    throw error;
  }
};

const deleteRedisKey = async (dockerfileSHA: string) => {
  const [_, error] = await redisDel(dockerfileSHA);
};

const createDockerFile = async (
  dockerfileContent: string,
  dockerfileSHA: string,
) => {
  const dockerfilePath = path.join(
    __dirname,
    "files/images",
    `${dockerfileSHA}.Dockerfile`,
  );
  await writeFile(dockerfilePath, dockerfileContent);
  return dockerfilePath;
};

const buildDockerImage = (dockerfilePath: string, dockerfileSHA: string) => {
  spawn("docker build", ["-f", dockerfilePath, "-t", dockerfileSHA, "."]);
};

const saveDockerImageToTGZ = (dockerfileSHA: string) => {
  spawn("docker save", ["-o", `${dockerfileSHA}.tgz`, dockerfileSHA]);
};

export const handleDockerImage = async (
  dockerfileContent: string,
  dockerfileSHA: string,
) => {
  await createRedisKey(dockerfileSHA);
  const dockerfilePath = await createDockerFile(
    dockerfileContent,
    dockerfileSHA,
  );
  buildDockerImage(dockerfilePath, dockerfileSHA);
  saveDockerImageToTGZ(dockerfileSHA);
  clearOutDockerQueues(dockerfileSHA);
  deleteRedisKey(dockerfileSHA);
};
