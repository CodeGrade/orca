import { RedisTransactionBuilder } from "@codegrade-orca/common";

export const deleteGraderImageKeyTransaction = async (
  transactionBuilder: RedisTransactionBuilder,
  graderImageSHA: string,
) => transactionBuilder.DEL(graderImageSHA);
