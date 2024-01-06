import { Response } from "express";

export const errorResponse = (
  res: Response,
  status: number,
  errors: string[],
) => {
  return res.status(status).json({ errors: errors });
};
