import { GradingJobConfig, GradingJobResult } from "@codegrade-orca/common";
import { Response } from "express";

export const errorResponse = (
  res: Response,
  status: number,
  errors: string[],
) => {
  return res.status(status).json({ errors: errors });
};

export const notifyClientOfCancelledJob = (jobConfig: GradingJobConfig) => {
  const result: GradingJobResult = {
    shell_responses: [],
    errors: ["Job cancelled by a course professor or Orca admin."]
  };
  console.info(jobConfig.response_url);
  fetch(jobConfig.response_url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...result, key: jobConfig.key })
  }).catch((err) =>
    console.error(
      `Encountered the following error while attempting to notify client of Job cancellation: ${err}`
    ));
}
