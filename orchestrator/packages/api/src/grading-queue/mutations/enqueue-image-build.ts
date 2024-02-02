import {
  GraderImageBuildRequest,
  RedisTransactionBuilder,
  runOperationWithLock,
} from "@codegrade-orca/common";

const enqueueImageBuild = async (imageBuildReq: GraderImageBuildRequest) => {
  await runOperationWithLock(async (redisConnection) => {
    const tb = enqueueImageBuildTransaction(
      new RedisTransactionBuilder(redisConnection),
      imageBuildReq,
    );
    const executor = await tb.build();
    await executor.execute();
  });
};

const enqueueImageBuildTransaction = (
  transactionBuilder: RedisTransactionBuilder,
  imageBuildReq: GraderImageBuildRequest,
): RedisTransactionBuilder =>
  transactionBuilder
    .SET(imageBuildReq.dockerfileSHASum, JSON.stringify(imageBuildReq))
    .LPUSH("BuildRequests", imageBuildReq.dockerfileSHASum);

export default enqueueImageBuild;
