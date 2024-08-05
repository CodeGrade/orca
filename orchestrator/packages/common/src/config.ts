import { join } from "path";

export interface OrchestratorConfig {
  api: OrchestratorAPIOptions;
  dockerImageFolder: string;
  postgresURL: string;
  environment: string;
}

interface OrchestratorAPIOptions {
  port?: number;
}

export const getConfig = (): OrchestratorConfig => ({
  postgresURL: process.env.POSTGRES_URL || "postgresql://localhost:5432",
  api: {
    port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8090,
  },
  dockerImageFolder: join(__dirname, "../../../", "images"),
  environment: process.env.ENVIRONMENT?.toLowerCase() || 'dev'
});
