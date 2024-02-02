import {
  GradingJob,
  GradingQueueOperationError,
  MoveJobRequest,
  RedisTransactionBuilder,
  collationToString,
  createOrUpdateJobTransaction,
  runOperationWithLock,
  toMilliseconds,
} from "@codegrade-orca/common";
import Redis from "ioredis";

const MOVE_TO_BACK_BUFFER = toMilliseconds(10);

const moveJob = async (moveJobReq: MoveJobRequest) => {
  await runOperationWithLock(async (redisConnection) => {
    const tb = await moveJobTransaction(
      redisConnection,
      new RedisTransactionBuilder(redisConnection),
      moveJobReq,
    );
    const executor = await tb.build();
    await executor.execute();
  });
};

const moveJobTransaction = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  moveRequest: MoveJobRequest,
): Promise<RedisTransactionBuilder> => {
  const { moveAction, orcaKey } = moveRequest;
  switch (moveAction) {
    case "release":
      const currentJob = await redisConnection.get(orcaKey);
      if (!currentJob) {
        throw new GradingQueueOperationError(
          `Attempted to move a job under key ${orcaKey} that does not exist.`,
        );
      }
      const { created_at, release_at, orca_key, nonce, ...jobConfig } =
        JSON.parse(currentJob) as GradingJob;
      return await createOrUpdateJobTransaction(
        redisConnection,
        transactionBuilder,
        jobConfig,
        orcaKey,
        created_at,
        true,
      );
    case "delay":
      return await delayJob(redisConnection, transactionBuilder, moveRequest);
    default:
      throw new TypeError(
        `Invalid action "${moveAction}" provided in move request.`,
      );
  }
};

const delayJob = async (
  redisConnection: Redis,
  transactionBuilder: RedisTransactionBuilder,
  { collation, orcaKey, nonce }: MoveJobRequest,
): Promise<RedisTransactionBuilder> => {
  const reservationsZRange = zrangeToItems(
    await redisConnection.zrange("Reservations", -1, -1, "WITHSCORES"),
  );
  const lastJobPriority = reservationsZRange[0].score;
  const newPriority = lastJobPriority + MOVE_TO_BACK_BUFFER;
  const submitterInfoKey = `SubmitterInfo.${collationToString(collation)}`;
  const reservationMember = `${collationToString(collation)}.${nonce}`;
  return transactionBuilder
    .ZADD("Reservations", reservationMember, newPriority)
    .LREM(submitterInfoKey, orcaKey)
    .RPUSH(submitterInfoKey, orcaKey);
};

export default moveJob;
function zrangeToItems(arg0: string[]) {
  throw new Error("Function not implemented.");
}
