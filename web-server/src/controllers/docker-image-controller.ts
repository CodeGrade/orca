import { Request, Response } from "express";
import validations from "../validations";
import { errorResponse } from "./utils";
import {
  getRedisConnection,
  runOperationWithLock,
} from "../grading-queue/utils";
import operations from "../grading-queue/operations";
import { RedisTransactionBuilder } from "../grading-queue/transactions";
import { createAndStoreGraderImage } from "../grader-images";
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
    res.sendStatus(200);
  } catch (error) {
    errorResponse(res, 500, [
      "Something went wrong when attempting to initiate the build process. Please contact an admin.",
    ]);
  }
};

const processBuildRequest = async (buildReq: GraderImageBuildRequest) => {
  let imageBuiltSuccessfully = false;
  try {
    await createAndStoreGraderImage(buildReq);
    imageBuiltSuccessfully = true;
    await runOperationWithLock(async (redisConnection) => {
      const tb = new RedisTransactionBuilder(redisConnection);
      await operations.releaseAllJobsFromHoldingPen(
        redisConnection,
        tb,
        buildReq,
      );
      const executor = await tb.build();
      await executor.execute();
    });
  } catch (error) {
    if (!imageBuiltSuccessfully) {
      await runOperationWithLock(async (redisConnection) => {
        const tb = new RedisTransactionBuilder(redisConnection);
        await operations.clearHoldingPen(redisConnection, tb, buildReq);
        await operations.deleteHoldingPenKey(tb, buildReq);
        const executor = await tb.build();
        await executor.execute();
      });
    }
  }
};
