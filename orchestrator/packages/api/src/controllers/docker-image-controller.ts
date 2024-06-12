import { Request, Response } from "express";
import { errorResponse } from "./utils";
import {
  validations,
} from "@codegrade-orca/common";
import { GradingQueueOperationException, enqueueImageBuild } from "@codegrade-orca/db";

export const createGraderImage = async (req: Request, res: Response) => {
  if (!validations.graderImageBuildRequest(req.body)) {
    return errorResponse(res, 400, [
      "The request body to build a grader image is invalid.",
    ]);
  }
  try {
    await enqueueImageBuild(req.body);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error(error);
    if (error instanceof GradingQueueOperationException) {
      return errorResponse(res, 400, [error.message]);
    } else {
      return errorResponse(res, 500, [
        "An error occured while trying to enqueue the image build request. Please contact an admin.",
      ]);
    }
  }
};
