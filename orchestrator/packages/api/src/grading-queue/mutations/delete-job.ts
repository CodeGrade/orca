import {
  DeleteJobRequest,
  RedisTransactionBuilder,
  collationToString,
  runOperationWithLock,
} from "@codegrade-orca/common";

const deleteJob = async (deleteJobReq: DeleteJobRequest) => {
  await runOperationWithLock(async (redisConnection) => {
    const tb = await deleteJobTransaction(
      new RedisTransactionBuilder(redisConnection),
      deleteJobReq,
    );
    const executor = await tb.build();
    await executor.execute();
  });
};

const deleteJobTransaction = async (
  transactionBuilder: RedisTransactionBuilder,
  { orcaKey, nonce, collation }: DeleteJobRequest,
): Promise<RedisTransactionBuilder> => {
  let reservationMember: string;
  if (collation && nonce) {
    const collationString = collationToString(collation);
    const submitterInfoKey = `SubmitterInfo.${collationString}`;
    reservationMember = `${collationString}.${nonce}`;
    transactionBuilder
      .SREM(`Nonces.${collationString}`, nonce.toString())
      .LREM(submitterInfoKey, orcaKey)
      .ZREM("Reservations", reservationMember)
      .DEL(orcaKey);
  } else {
    reservationMember = `immediate.${orcaKey}`;
    transactionBuilder.ZREM("Reservations", reservationMember).DEL(orcaKey);
  }
  return transactionBuilder;
};

export default deleteJob;
