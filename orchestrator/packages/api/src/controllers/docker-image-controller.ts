import { Request, Response } from "express";
import { errorResponse } from "./utils";
import {
  GradingQueueOperationError,
  validations,
} from "@codegrade-orca/common";
import enqueueImageBuild from "../grading-queue/mutations/enqueue-image-build";

export const createGraderImage = async (req: Request, res: Response) => {
  if (!validations.graderImageBuildRequest(req.body)) {
    return errorResponse(res, 400, [
      "The request body to build a grader image is invalid.",
    ]);
  }
  try {
    await enqueueImageBuild(req.body);
  } catch (error) {
    if (error instanceof GradingQueueOperationError) {
      errorResponse(res, 400, [error.message]);
    } else {
      errorResponse(res, 500, [
        "An error occured while trying to enqueue the image build request. Please contact an admin.",
      ]);
    }
  }
};
