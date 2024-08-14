import pino from "pino";
import { getConfig } from "./config";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const _CONFIG = getConfig();

const pinoTarget = {
  target: 'pino/file',
  options: {
    destination: _CONFIG.orchestratorLogsDir ?
      path.join(_CONFIG.orchestratorLogsDir, `${_CONFIG.environment}.log`) :
      1 // used by pino for STDOUT
  }
}

const transport = pino.transport({
  targets: [
    pinoTarget
  ]
});

const getLogger = () => {
  if (_CONFIG.orchestratorLogsDir && !existsSync(_CONFIG.orchestratorLogsDir)) {
    mkdirSync(_CONFIG.orchestratorLogsDir, { recursive: true });
  }
  return pino({
    level: getConfig().environment === 'production' ? 'info' : 'debug',
    timestamp: true,
  }, transport)
}

const logger = getLogger();

export default logger;
