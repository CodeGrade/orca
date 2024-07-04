import { Request, Response } from "express";
import { errorResponse } from "./utils";
import {
  validations,
} from "@codegrade-orca/common";
import { GradingQueueOperationException, enqueueImageBuild, imageIsBeingBuilt } from "@codegrade-orca/db";
import { graderImageExists } from "../utils/grader-images";

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

export const getImageBuildStatus = async (req: Request, res: Response) => {
  const { dockerfileSHA } = req.params;
  if (graderImageExists(dockerfileSHA)) {
    res.json(`Image ${dockerfileSHA} is ready to be used for gradng.`);
  } else if (await imageIsBeingBuilt(dockerfileSHA)) {
  } else {
    res.json(`No image ${dockerfileSHA} exists on the server.`);
  }
}
