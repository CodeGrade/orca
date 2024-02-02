import {
  GraderImageBuildRequest,
  GradingQueueOperationError,
  RedisTransactionBuilder,
  runOperationWithLock,
  toMilliseconds,
} from "@codegrade-orca/common";
import { processBuildRequest, removeStaleImageFiles } from "./process-request";

const LOOP_SLEEP_TIME = 10; // Seconds

const main = async () => {
  while (true) {
    const nextBuildReq = await getNextBuildRequest();
    if (!nextBuildReq) {
      sleep(LOOP_SLEEP_TIME);
      continue;
    }
    await processBuildRequest(nextBuildReq);
    await removeStaleImageFiles();
  }
};

const getNextBuildRequest =
  async (): Promise<GraderImageBuildRequest | null> => {
    return await runOperationWithLock(async (redisConnection) => {
      // TODO: Add LPOP as a Transaction Operation
      const nextSHA = await redisConnection.lpop("BuildRequests");
      if (!nextSHA) {
        return null;
      }
      const buildRequest = JSON.parse(
        await redisConnection.get(nextSHA),
      ) as GraderImageBuildRequest;
      return buildRequest;
    });
  };

const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, toMilliseconds(seconds));
  });
};

main();
