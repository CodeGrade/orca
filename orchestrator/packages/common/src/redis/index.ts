import Redis from "ioredis";
import { getConfig } from "../config";
import Redlock from "redlock";

const LOCK_AQUISITION_TIME = 10 * 1_000; // 10s in ms

export const getRedisConnection = (): Redis => {
  return new Redis(getConfig().redis);
};

export const runOperationWithLock = async <T>(
  operation: (redisConnection: Redis) => Promise<T>,
) => {
  const redisConnection = getRedisConnection();
  const lock = await acquireLock(redisConnection);
  try {
    return await operation(redisConnection);
  } finally {
    lock.release();
    redisConnection.quit();
  }
};

const acquireLock = async (redisConnection: Redis) => {
  const redlock = new Redlock([redisConnection]);
  return await redlock.acquire(["GradingQueue"], LOCK_AQUISITION_TIME);
};

export * from "./transactions";
