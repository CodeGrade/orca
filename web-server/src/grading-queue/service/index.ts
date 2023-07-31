import { RedisClientType, createClient } from "redis";
import { Collation, EnrichedGradingJob, GradingJob } from "../types";
import { default as redisLock } from "redis-lock";
import rollbacks from "./redis/rollbacks";
import { isEqual } from "lodash";
import { GradingQueueServiceError } from "./exceptions";
import CONFIG from "../../config";

type RedisLockRelease = () => Promise<void>;
type RedisLock = (
  lockName: string,
  timeout: number,
) => Promise<RedisLockRelease>;
const DEFAULT_TIMEOUT = 5000;

/**
 * Wraps operations carried out by a Redis client needed to
 * interact with the queue.
 */
export class GradingQueueService {
  private readonly client: RedisClientType;
  private readonly lock: RedisLock;

  constructor() {
    this.client = createClient({
      url: CONFIG.redisURL,
    });
    this.client.on("error", (err: Error) => {
      console.error(
        `The following error was encounterred when connecting to Redis: ${err}`,
      );
    });
    this.lock = redisLock(this.client);
  }

  public async createOrUpdateJob(
    job: GradingJob,
    arrivalTime: number,
    orcaKey: string,
    isImmediateJob: boolean,
  ) {
    this.runOperationWithLock(async () => {
      const nonImmediateJobExists = await this.nonImmediateJobExists(
        orcaKey,
        job.collation,
      );
      if (nonImmediateJobExists && isImmediateJob) {
        await this.deleteNonImmediateJob(orcaKey, job.collation);
      } else if (nonImmediateJobExists) {
        const originalJob: EnrichedGradingJob = JSON.parse(
          (await this.client.GET(orcaKey)) as string,
        );
        const updatedJob: EnrichedGradingJob = {
          ...originalJob,
          ...job,
        };
        await this.client.SET(orcaKey, JSON.stringify(updatedJob));
        return;
      }
      await this.enqueueJob(job, arrivalTime, orcaKey, isImmediateJob);
    });
  }

  private async runOperationWithLock<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    await this.client.connect();
    const releaseLock = await this.lock("GradingQueue", DEFAULT_TIMEOUT);
    try {
      return await operation();
    } finally {
      await releaseLock();
      await this.client.quit();
    }
  }

  private async enqueueJob(
    job: GradingJob,
    arrivalTime: number,
    orcaKey: string,
    isImmediateJob: boolean,
  ) {
    if (isImmediateJob) {
      await this.createImmediateJob(job, arrivalTime, orcaKey);
    } else {
      await this.createJob(job, arrivalTime, orcaKey);
    }
  }

  private async deleteNonImmediateJob(orcaKey: string, collation: Collation) {
    const nonce = await this.client.SPOP(
      `Nonces.${collation.type}.${collation.id}`,
    );
    if (nonce.length == 0) {
      throw new GradingQueueServiceError(
        `There are no nonces for the collation ${collation.type} ${collation.id}`,
      );
    }
    // const expectedReplies = [1, 1, 1];
    await this.client
      .multi()
      .ZREM("Reservations", `${collation.type}.${collation.id}.${nonce}`)
      .LREM(`SubmitterInfo.${collation.type}.${collation.id}`, 0, orcaKey)
      .DEL(orcaKey)
      .exec();
  }

  private async nonImmediateJobExists(orcaKey: string, collation: Collation) {
    const { type, id } = collation;
    const pos = await this.client.LPOS(`SubmitterInfo.${type}.${id}`, orcaKey);
    return pos !== null;
  }

  private async createImmediateJob(
    gradingJob: GradingJob,
    arrivalTime: number,
    orcaKey: string,
  ) {
    const enrichedGradingJob: EnrichedGradingJob = {
      ...gradingJob,
      created_at: arrivalTime,
      release_at: arrivalTime,
      orca_key: orcaKey,
    };

    const expectedReplies = [1, "OK"];

    const replies = await this.client
      .multi()
      .ZADD("Reservations", {
        score: arrivalTime,
        value: `immediate.${orcaKey}`,
      })
      .SET(orcaKey, JSON.stringify(enrichedGradingJob))
      .exec();
    this.assertReplies(
      new GradingQueueServiceError(
        `Could not create an immediate job from given inputs. 
        Transaction has been rolled back.`,
      ),
      replies,
      expectedReplies,
      rollbacks.createImmediateJob,
      this.client,
      orcaKey,
    );
  }

  private async createJob(
    gradingJob: GradingJob,
    arrivalTime: number,
    orcaKey: string,
  ) {
    const { priority, collation } = gradingJob;
    const releaseTime = arrivalTime + priority;
    const nextTask = `${collation.type}.${collation.id}`;
    const enrichedJob: EnrichedGradingJob = {
      ...gradingJob,
      created_at: arrivalTime,
      release_at: releaseTime,
      orca_key: orcaKey,
    };
    const nonce = await this.generateNonce(enrichedJob, arrivalTime);
    const originalSubmitterInfoLength = await this.client.LLEN(
      `SubmitterInfo.${nextTask}`,
    );
    const expectedReplies = [1, originalSubmitterInfoLength + 1, 1, "OK"];
    const replies = await this.client
      .multi()
      .ZADD("Reservations", {
        score: releaseTime,
        value: `${nextTask}.${nonce}`,
      })
      .LPUSH(`SubmitterInfo.${nextTask}`, orcaKey)
      .SADD(`Nonces.${nextTask}`, orcaKey)
      .SET(orcaKey, JSON.stringify(enrichedJob))
      .exec();
    await this.assertReplies(
      new GradingQueueServiceError(
        "Error during job creation transaction; rollback steps completed.",
      ),
      replies,
      expectedReplies,
      rollbacks.createJob,
    );
  }

  private async generateNonce(job: EnrichedGradingJob, arrivalTime: number) {
    let nonce = arrivalTime + job.priority;
    while (
      await this.client.SISMEMBER(
        `Nonces.${job.collation.type}${job.collation.id}`,
        nonce.toString(),
      )
    ) {
      nonce++;
    }
    return nonce;
  }

  private async assertReplies(
    err: Error,
    replies: unknown[],
    expectedReplies: unknown[],
    rollbackFunction: (...args: unknown[]) => Promise<void>,
    ...args: unknown[]
  ) {
    if (!isEqual(replies, expectedReplies)) {
      rollbackFunction(...args);
      throw err;
    }
  }
}
