import { Request, Response } from "express";
import { errorResponse } from "./utils";
import {
  GradingQueueOperationError,
  createServiceLogger,
  validations,
} from "@codegrade-orca/common";
import enqueueImageBuild from "../grading-queue/mutations/enqueue-image-build";

const LOGGER = createServiceLogger('docker-image-controller');

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
    LOGGER.error(error);
    if (error instanceof GradingQueueOperationError) {
      return errorResponse(res, 400, [error.message]);
    } else {
      return errorResponse(res, 500, [
        "An error occured while trying to enqueue the image build request. Please contact an admin.",
      ]);
    }
  }
};
