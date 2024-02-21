import winston = require("winston")
import { getConfig } from "../config";
import { join } from "path";

const CONFIG = getConfig();

export const createServiceLogger = (serviceName: string) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.File({ filename: join(CONFIG.logFolder, `${serviceName}.log`) }),
    ]
  });
}
