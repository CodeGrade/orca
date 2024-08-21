import { GradingJobConfig, GradingJobResult, logger } from "@codegrade-orca/common";
import { Response } from "express";

export const errorResponse = (
  res: Response,
  status: number,
  errors: string[],
) => {
  if (isClientError(status)) {
    logger.warn(errors.join(', '));
  } else {
    logger.error(errors.join(', '));
  }
  return res.status(status).json({ errors: errors });
};

export const formatValidationError = (instancePath: string, message: string | undefined): string => {
  let result = '';
  result += instancePath;
  if (instancePath.length && message) {
    result += ' ';
  }
  return result + message ?? '';
}

const isClientError = (statusCode: number): boolean => statusCode > 399 && statusCode < 500;

export const notifyClientOfCancelledJob = (jobConfig: GradingJobConfig) => {
  const result: GradingJobResult = {
    shell_responses: [],
    errors: ["Job cancelled by a course professor or Orca admin."]
  };
  fetch(jobConfig.response_url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...result, key: jobConfig.key })
  }).catch((err) =>
    logger.error(
      `Encountered the following error while attempting to notify client of Job cancellation: ${err}`
    ));
}
