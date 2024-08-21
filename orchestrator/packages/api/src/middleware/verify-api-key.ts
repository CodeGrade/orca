import { getConfig, logger } from "@codegrade-orca/common";
import { validAPIKey } from "@codegrade-orca/db";
import { Request, Response, NextFunction } from "express";

const verifyAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("x-api-key");
  const urlStr = req.body['response_url'] ?? req.header('x-forwarded-for');
  try {
    const hostname = getConfig().environment === 'production' ? hostnameHandler(urlStr) : req.hostname;
    logger.info(`API Key: |${apiKey ?? 'None'}| Hostname: |${hostname}|`);
    if (!apiKey) {
      return res.sendStatus(401);
    }
    return (await validAPIKey(hostname, apiKey)) ? next() : res.sendStatus(401);
  } catch (e) {
    logger.warn(`Error: while constructing url or validating key for ${apiKey} and ${urlStr}: ${e}`);
    res.sendStatus(401);
  }
};

const hostnameHandler = (urlStr: string) => new URL(urlStr).hostname;

export default verifyAPIKey;
