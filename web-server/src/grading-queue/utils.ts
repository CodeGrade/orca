import Redis from "ioredis";
import { Collation } from "./types";
import { createHash } from "crypto";
import CONFIG from "../config";
import Redlock from "redlock";
import {
  RedisTransactionBuilder,
  TransactionExecutionResult,
} from "./transactions";

const LOCK_AQUISITION_TIME = 10000; // 10 Seconds

export const getRedisConnection = (): Redis => {
  return new Redis(CONFIG.redisURL);
};

export const runOperationWithLock = async <T>(
  operation: () => Promise<T>,
  redisConnection: Redis,
): Promise<Awaited<T>> => {
  const redlock = new Redlock([redisConnection]);
  const lock = await redlock.acquire(["GradingQueue"], LOCK_AQUISITION_TIME);
  try {
    return await operation();
  } finally {
    await lock.release();
    await redisConnection.quit();
  }
};

export const executeTransactions = async (
  transactionsBuilders: Array<RedisTransactionBuilder>,
): Promise<void> => {
  const transactionResults: Array<TransactionExecutionResult> = [];
  for (let i = 0; i < transactionsBuilders.length; ++i) {
    const executor = await transactionsBuilders[i].build();
    const transactionResult = await executor.execute();
    transactionResults.push(transactionResult);
    const transactionError = transactionResult[1];
    if (transactionError) {
      await Promise.all(
        transactionResults
          .toReversed()
          .map(
            async ([rollbackMultiCommand]) => await rollbackMultiCommand.exec(),
          ),
      );
      throw transactionError;
    }
  }
  transactionResults.forEach(([rollbackMultiCommand]) =>
    rollbackMultiCommand.discard(),
  );
};

export const generateQueueKey = (originKey: string, responseURL: string) => {
  const hash = createHash("sha256");
  hash.update(originKey + responseURL);
  return hash.digest("base64");
};

export const collationToString = (collation: Collation) => {
  return `${collation.type}.${collation.id}`;
};

export const toMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};

export const isNumberArray = (
  arr: Array<number | null>,
): arr is Array<number> => {
  return arr.every((n) => n !== null);
};
