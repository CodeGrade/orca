interface OrcaWebServerConfig {
  redisURL: string;
}

const CONFIG: OrcaWebServerConfig = {
  redisURL: process.env.REDIS_URL || "redis://localhost:6379",
};

export default CONFIG;
