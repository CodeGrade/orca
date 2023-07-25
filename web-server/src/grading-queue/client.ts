import { RedisClientType, createClient } from "redis";
import { redisLock } from "redis-lock";

const DEFAULT_TIMEOUT = 5000;

// The imported redis-lock package does not have
// its own type definitions. These are defined based on
// its logic.
// https://github.com/errorception/redis-lock/blob/master/index.js
type RedisLockRelease = () => Promise<void>;
type RedisLock = (
  lockName: string,
  timeout: number,
) => Promise<RedisLockRelease>;

export class OrcaRedisClient {
  private static instance: OrcaRedisClient;
  private client: RedisClientType;
  private lock: RedisLock;

  public constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.lock = redisLock(this.client);
  }

  public async runOperation<T>(
    redisOperation: (client: RedisClientType) => Promise<T>,
    withLock: boolean,
  ): Promise<T> {
    try {
      await this.client.connect();
      return await (withLock
        ? this.runWithLock(redisOperation)
        : redisOperation(this.client));
    } finally {
      await this.client.disconnect();
    }
  }

  private async runWithLock<T>(
    redisOperation: (client: RedisClientType) => Promise<T>,
  ): Promise<T> {
    const releaseLock = await this.lock("GradingQueue", DEFAULT_TIMEOUT);
    try {
      return await redisOperation(this.client);
    } finally {
      await releaseLock();
    }
  }
}
