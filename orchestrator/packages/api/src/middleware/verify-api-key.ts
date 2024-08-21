import { logger } from "@codegrade-orca/common";
import { validAPIKey } from "@codegrade-orca/db";
import { Request, Response, NextFunction } from "express";

const verifyAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("x-api-key");
  const urlStr = req.body.response_url ?? req.header;
  logger.info(`API Key: |${apiKey ?? 'None'}| URLString: |${urlStr ?? 'None'}|`);
  if (!apiKey) {
    return res.sendStatus(401);
  }
  try {
    const url = new URL(urlStr);
    if (await validAPIKey(url.hostname, apiKey)) {
      return next();
    }
  } catch (e) {
    logger.warn(`Error: while constructing url or validating key for ${apiKey} and ${urlStr}: ${e}`);
  }
  res.sendStatus(401);
};
export default verifyAPIKey;
