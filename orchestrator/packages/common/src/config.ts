import { RedisOptions } from "ioredis";
import { join } from "path";

export interface OrchestratorConfig {
  redis: RedisOptions;
  api: OrchestratorAPIOptions;
  dockerImageFolder: string;
}

interface OrchestratorAPIOptions {
  port?: number;
}

export const getConfig = () => ({
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  },
  api: {
    port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8090,
  },
  dockerImageFolder: join(__dirname, "../../../", "images"),
});
