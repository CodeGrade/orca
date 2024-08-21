import { Request, Response } from "express";
import { errorResponse, formatValidationErrors } from "./utils";
import {
    graderImageExists,
  logger,
  validations,
} from "@codegrade-orca/common";
import { GradingQueueOperationException, enqueueImageBuild, imageIsAwaitingBuild, imageIsBeingBuilt } from "@codegrade-orca/db";

export const createGraderImage = async (req: Request, res: Response) => {
  const validator = validations.graderImageBuildRequest;
  if (!validator(req.body)) {
    return errorResponse(res, 400, formatValidationErrors("The request body to build a grader image is invalid.", validator.errors));
  }
  const { dockerfile_sha_sum } = req.body;
  if (graderImageExists(dockerfile_sha_sum)) {
    return res.status(200).json({ message: "This grader already exists on the server; no build needed." });
  }
  try {
    await enqueueImageBuild(req.body);
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    if (error instanceof GradingQueueOperationException) {
      return errorResponse(res, 400, [error.message]);
    } else {
      logger.error(`Could not enqueue image build; ${error}`);
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
    res.json(`Image ${dockerfileSHA} is in the process of being built.`);
  } else if (await imageIsAwaitingBuild(dockerfileSHA)) {
    res.json(`Image ${dockerfileSHA} is waiting to be built.`);
  } else {
    res.json(`No image ${dockerfileSHA} exists on the server.`);
  }
}
