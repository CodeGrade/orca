import { Request, Response } from "express";
import { errorResponse, formatValidationErrors } from "./utils";
import { validations } from "@codegrade-orca/common";

export const gradingJobValidation = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, 400, ['No request body provided for grading job configuration schema validation.']);
  }
  const validator = validations.gradingJobConfig;
  return validator(req.body) ?
    res.json({ "message": "Provided request body is a valid grading job configuration." }) :
    res.json({ "errors": formatValidationErrors(validator.errors) });
}
