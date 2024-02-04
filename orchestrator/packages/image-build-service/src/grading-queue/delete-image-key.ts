import { RedisTransactionBuilder } from "@codegrade-orca/common";

export const deleteGraderImageKeyTransaction = (
  transactionBuilder: RedisTransactionBuilder,
  graderImageSHA: string,
): RedisTransactionBuilder => transactionBuilder.DEL(graderImageSHA);
