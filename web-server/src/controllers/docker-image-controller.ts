import { Request, Response } from "express";
import validations from "../validations";
import { errorResponse } from "./utils";
import { runOperationWithLock } from "../grading-queue/utils";
import operations from "../grading-queue/operations";
import { RedisTransactionBuilder } from "../grading-queue/transactions";
import {
  createAndStoreGraderImage,
  removeStaleImageFiles,
} from "../grader-images";
import { GraderImageBuildRequest } from "../grader-images/types";

export const createGraderImage = async (req: Request, res: Response) => {
  if (!validations.graderImageBuildRequest(req.body)) {
    return errorResponse(res, 400, [
      "The request body to build a grader image is invalid.",
    ]);
  }
  // TODO: Validate Dockerfile syntax
  try {
    await runOperationWithLock(async (redisConnection) => {
      const tb = await operations.createHoldingPenKey(
        new RedisTransactionBuilder(redisConnection),
        req.body,
      );
      const executor = await tb.build();
      await executor.execute();
    });
    res.status(200).json({ message: "OK" });
  } catch (error) {
    errorResponse(res, 500, [
      "Something went wrong when attempting to initiate the build process. Please contact an admin.",
    ]);
  }
  await processBuildRequest(req.body).catch((reason) => {
    // TODO: This is where we would want to send out a message to Bottlenose (or other service)
    // to inform the sender that their image build failed.
    // One thought would be to take all jobs that were in the holding pen and "cancel" them with a response that is sent back to their
    // respective response_url properties.
    console.error(reason);
  });
};

export const cleanUpUnusedGraderImages = async (
  _req: Request,
  res: Response,
) => {
  return await removeStaleImageFiles()
    .then((imagesRemoved) => res.status(200).json({ imagesRemoved }))
    .catch((err) =>
      errorResponse(res, 500, [
        `Encountered the following issue when attempting to clean up images: ${err.message}`,
      ]),
    );
};
