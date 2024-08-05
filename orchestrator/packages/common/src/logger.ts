import pino from "pino";
import { getConfig } from "./config";
import path from "path";

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: {
        destination: path.join(__dirname, '../../../', 'logs', `${getConfig().environment}.log`),
        mkdir: true
      }
    },
    {
      target: 'pino/file',
      options: { destination: 2 }
    }
  ]
});

const logger = pino({
  level: getConfig().environment === 'production' ? 'info' : 'debug',
  timestamp: true,
}, transport);

export default logger;
