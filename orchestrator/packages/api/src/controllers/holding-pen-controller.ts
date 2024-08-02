import { Request, Response } from "express";
import { errorResponse } from "./utils";
import { jobConfigInHoldingPen } from "@codegrade-orca/db";

export const holdingPenStatus = async (req: Request, res: Response) => {
  const jobConfigID = parseInt(req.params.jobConfigID);
  if (isNaN(jobConfigID)) {
    return errorResponse(res, 400, [`Given job config ID ${jobConfigID} is not a number.`]);
  }
  if (await jobConfigInHoldingPen(jobConfigID)) {
    res.json("This job is waiting of a grader image to build.");
  } else {
    res.json("This job could not be found in a holding pen. Please contact an admin or professor.");
  }
}
