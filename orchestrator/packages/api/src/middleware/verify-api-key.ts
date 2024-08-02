import { validAPIKey } from "@codegrade-orca/db";
import { Request, Response, NextFunction } from "express";

const verifyAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("x-api-key");
  if (!apiKey) {
    return res.sendStatus(401);
  }
  if (await validAPIKey(req.hostname, apiKey)) {
    next();
  } else {
    res.sendStatus(401);
  }
};
export default verifyAPIKey;
