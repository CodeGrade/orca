import { RedisClientType, createClient } from "redis";
import {
  Collation,
  DeleteJobRequest,
  GradingJob,
  GradingJobConfig,
  MoveJobRequest,
} from "../types";
import { default as redisLock } from "redis-lock";
import { GradingQueueServiceError } from "./exceptions";
import CONFIG from "../../config";
import { collationToString } from "../utils";
import { toMilliseconds } from "./utils";

// NOTE: Redis lock logic unfortunately does not have typing information.
// Thus, here we are manually typing it based on the source code.
type RedisLockRelease = () => Promise<void>;
type RedisLock = (
  lockName: string,
  timeout: number,
) => Promise<RedisLockRelease>;

// NOTE: Redis' .d.ts files do not yield an importable type definition
// of the return type of RedisClient.multi, meaning we need to do the following
// to actually acquire it:
type RedisClientMultiCommandType = ReturnType<
  ReturnType<typeof createClient>["multi"]
>;

const DEFAULT_TIMEOUT = 5000;
const MOVE_TO_BACK_BUFFER = toMilliseconds(10);

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
      throw new GradingQueueServiceError(
        "Could not connect to client successfully.",
      );
    });
    this.lock = redisLock(this.client);
  }

  public async getGradingJobs(): Promise<GradingJob[]> {
    return await this.runOperationWithLock(async () => {
      const reservations = await this.client.ZRANGE_WITHSCORES(
        "Reservations",
        0,
        -1,
      );
      if (reservations.length === 0) return [];
      const submitterInfoCache: Record<string, string[]> = {};
      return await Promise.all(
        reservations.map(async (reservation) => {
          const { value: reservationKey } = reservation;
          const reservationKeySections = reservationKey.split(".");

          if (reservationKeySections.length === 2) {
            return await this.getImmediateJobFromReservation(
              reservationKeySections,
            );
          } else {
            return await this.getJobFromReservation(
              reservationKeySections,
              submitterInfoCache,
            );
          }
        }),
      );
    });
  }

  public async moveJob(moveRequest: MoveJobRequest) {
    await this.runOperationWithLock(async () => {
      const { moveAction, orcaKey } = moveRequest;
      switch (moveAction) {
        case "release":
          const currentJob = await this.client.GET(orcaKey);
          if (!currentJob) {
            throw new GradingQueueServiceError(
              `Could not find job with key ${orcaKey}`,
            );
          }
          const { created_at, release_at, orca_key, nonce, ...baseGradingJob } =
            JSON.parse(currentJob) as GradingJob;
          await this.createOrUpdateJob(
            baseGradingJob,
            created_at,
            orcaKey,
            true,
          );
          break;
        case "delay":
          await this.delayJob(moveRequest);
          break;
        default:
          throw new TypeError(
            `Invalid moveAction ${moveAction} provided in MoveJobRequest.`,
          );
      }
    });
  }

  public async deleteJob({ orcaKey, nonce, collation }: DeleteJobRequest) {
    await this.runOperationWithLock(async () => {
      let transactionBuilder = new RedisTransactionBuilder(this.client);
      let reservationMember: string;
      if (collation && nonce !== undefined) {
        const collationString = collationToString(collation);
        const submitterInfoKey = `SubmitterInfo.${collationString}`;
        reservationMember = `${collationString}.${nonce}`;
        transactionBuilder = transactionBuilder
          .SREM(`Nonces.${collationString}`, nonce.toString())
          .LREM(
            submitterInfoKey,
            orcaKey,
            await this.client.LPOS(submitterInfoKey, orcaKey),
          )
          .ZREM(
            "Reservations",
            reservationMember,
            await this.client.ZSCORE("Reservations", reservationMember),
          )
          .DEL(orcaKey, await this.client.GET(orcaKey));
      } else {
        reservationMember = `immediate.${orcaKey}`;
        transactionBuilder = transactionBuilder
          .ZREM(
            "Reservations",
            reservationMember,
            await this.client.ZSCORE("Reservations", reservationMember),
          )
          .DEL(orcaKey, await this.client.GET(orcaKey));
      }
      await transactionBuilder.build().execute();
    });
  }

  public async createOrUpdateJob(
    jobConfig: GradingJobConfig,
    arrivalTime: number,
    orcaKey: string,
    isImmediateJob: boolean,
  ) {
    await this.runOperationWithLock(async () => {
      const nonImmediateJobExists = await this.nonImmediateJobExists(
        orcaKey,
        jobConfig.collation,
      );
      const immediateJobExists =
        (await this.client.ZSCORE("Reservations", `immediate.${orcaKey}`)) !==
        null;

      if (!nonImmediateJobExists && !immediateJobExists) {
        await this.enqueueJob(jobConfig, arrivalTime, orcaKey, isImmediateJob);
      } else if (nonImmediateJobExists && isImmediateJob) {
        await this.deleteNonImmediateJob(orcaKey, jobConfig.collation);
        await this.enqueueJob(jobConfig, arrivalTime, orcaKey, isImmediateJob);
      } else {
        const originalJob: GradingJob = JSON.parse(
          (await this.client.GET(orcaKey)) as string,
        );
        const updatedJob: GradingJob = {
          ...originalJob,
          ...jobConfig,
        };
        await this.client.SET(orcaKey, JSON.stringify(updatedJob));
      }
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

  private async delayJob({ collation, orcaKey, nonce }: MoveJobRequest) {
    const jobsZrange = await this.client.ZRANGE_WITHSCORES(
      "Reservations",
      -1,
      -1,
    );
    const lastJobPriority = jobsZrange[0].score;
    const newPriority = lastJobPriority + MOVE_TO_BACK_BUFFER;
    const submitterInfoKey = `SubmitterInfo.${collationToString(collation)}`;
    const reservationsMember = `${collationToString(collation)}.${nonce}`;
    const transactionBuilder = new RedisTransactionBuilder(this.client)
      .ZADD(
        "Reservations",
        newPriority,
        reservationsMember,
        await this.client.ZSCORE("Reservations", reservationsMember),
      )
      .LREM(
        submitterInfoKey,
        orcaKey,
        await this.client.LPOS(submitterInfoKey, orcaKey),
      )
      .RPUSH(submitterInfoKey, orcaKey);
    await transactionBuilder.build().execute();
  }

  private async enqueueJob(
    jobConfig: GradingJobConfig,
    arrivalTime: number,
    orcaKey: string,
    isImmediateJob: boolean,
  ) {
    if (isImmediateJob) {
      await this.createImmediateJob(jobConfig, arrivalTime, orcaKey);
    } else {
      await this.createJob(jobConfig, arrivalTime, orcaKey);
    }
  }

  private async deleteNonImmediateJob(orcaKey: string, collation: Collation) {
    const currentJob = await this.client.GET(orcaKey);
    const collationString = collationToString(collation);
    const nonceToDel = await this.getNonceToDelete(collation);

    const executor = new RedisTransactionBuilder(this.client)
      .SREM(`Nonces.${collationString}`, nonceToDel)
      .ZREM(
        "Reservations",
        `${collationString}.${nonceToDel}`,
        await this.client.ZSCORE(
          "Reservations",
          `${collationString}.${nonceToDel}`,
        ),
      )
      .LREM(
        `SubmitterInfo.${collationString}`,
        orcaKey,
        await this.client.LPOS(`SubmitterInfo.${collationString}`, orcaKey),
      )
      .DEL(orcaKey, currentJob)
      .build();
    await executor.execute();
  }

  private async getNonceToDelete(collation: Collation): Promise<string> {
    const collationString = collationToString(collation);
    const nonces: string[] = await this.client.SMEMBERS(
      `Nonces.${collationString}`,
    );
    const reservationScores = await this.client.ZMSCORE(
      "Reservations",
      nonces.map((n) => `${n}.${collationString}`),
    );
    if (!isNumberArray(reservationScores)) {
      throw new GradingQueueServiceError(
        `The number of nonces is not equal to the number of reservations for collation ${collationString}`,
      );
    }
    const scoreToIndex: Record<number, number> = reservationScores.reduce(
      (prev, curr, i) => (prev[curr] = i),
      {},
    );
    return nonces[scoreToIndex[reservationScores.sort()[0]]];
  }

  private async nonImmediateJobExists(orcaKey: string, collation: Collation) {
    const { type, id } = collation;
    const pos = await this.client.LPOS(`SubmitterInfo.${type}.${id}`, orcaKey);
    return pos !== null;
  }

  private async createImmediateJob(
    gradingJobConfig: GradingJobConfig,
    arrivalTime: number,
    orcaKey: string,
  ) {
    const gradingJob: GradingJob = {
      ...gradingJobConfig,
      created_at: arrivalTime,
      release_at: arrivalTime,
      orca_key: orcaKey,
    };

    const executor = new RedisTransactionBuilder(this.client)
      .ZADD("Reservations", arrivalTime, `immediate.${orcaKey}`, null)
      .SET(orcaKey, JSON.stringify(gradingJobConfig), null)
      .build();

    await executor.execute();
  }

  private async createJob(
    gradingJobConfig: GradingJobConfig,
    arrivalTime: number,
    orcaKey: string,
  ) {
    const { priority, collation } = gradingJobConfig;
    const releaseTime = arrivalTime + priority;
    const nextTask = `${collation.type}.${collation.id}`;
    const gradingJob: GradingJob = {
      ...gradingJobConfig,
      created_at: arrivalTime,
      release_at: releaseTime,
      orca_key: orcaKey,
    };
    const nonce = await this.generateNonce(gradingJob, arrivalTime);
    const executor = new RedisTransactionBuilder(this.client)
      .LPUSH(`SubmitterInfo.${nextTask}`, orcaKey)
      .ZADD("Reservations", nonce, `${nextTask}.${nonce}`, null)
      .SADD(
        `Nonces.${nextTask}`,
        nonce.toString(),
        await this.client.SISMEMBER(`Nonces.${nextTask}`, nonce.toString()),
      )
      .SET(orcaKey, JSON.stringify(gradingJob), null)
      .build();
    await executor.execute();
  }

  private async getImmediateJobFromReservation(
    reservationKeySections: string[],
  ): Promise<GradingJob> {
    const [_, orcaKey] = reservationKeySections;
    const enqueuedJobString = await this.client.GET(orcaKey);
    if (enqueuedJobString === null) {
      throw new GradingQueueServiceError(
        `Could not find a job with key ${orcaKey}.`,
      );
    }
    return JSON.parse(enqueuedJobString) as GradingJob;
  }

  private async getJobFromReservation(
    reservationKeySections: string[],
    submitterInfoCache: Record<string, string[]>,
  ): Promise<GradingJob> {
    const collationString = reservationKeySections
      .slice(0, reservationKeySections.length - 1)
      .join(".");

    const submitterInfoKey = `SubmitterInfo.${collationString}`;
    if (!submitterInfoCache[submitterInfoKey]) {
      const orcaKeys = await this.client.LRANGE(submitterInfoKey, 0, -1);
      submitterInfoCache[submitterInfoKey] = orcaKeys;
    }

    const orcaKey = submitterInfoCache[submitterInfoKey].shift();
    if (!orcaKey) {
      throw new GradingQueueServiceError(
        `No job key to match reservation ${reservationKeySections.join(".")}.`,
      );
    }
    const enqueuedJobString = await this.client.GET(orcaKey);
    if (!enqueuedJobString) {
      throw new GradingQueueServiceError(
        `No job was found with key ${orcaKey}.`,
      );
    }
    return JSON.parse(enqueuedJobString) as GradingJob;
  }

  private async generateNonce(job: GradingJob, arrivalTime: number) {
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
}

const isNumberArray = (arr: Array<number | null>): arr is Array<number> => {
  return arr.every((n) => n !== null);
};

type RedisRollbackOperation = (
  actualReply: string | number,
) => RedisClientMultiCommandType; // RedisClientMultiCommandType

class RedisTransactionExecutor {
  private readonly userMultiCommand;
  private readonly rollbacks: Array<RedisRollbackOperation>;
  private readonly expectedReplies: Array<string | number>;

  constructor(
    userOperations: any, // RedisClientMultiCommandType
    rollbacks: Array<RedisRollbackOperation>,
    expectedReplies: Array<string | number>,
  ) {
    if (rollbacks.length !== expectedReplies.length) {
      throw new GradingQueueServiceError(
        "A transaction is not valid is the length of the rollbacks and expected replies are not equal.",
      );
    }
    this.userMultiCommand = userOperations;
    this.rollbacks = rollbacks;
    this.expectedReplies = expectedReplies;
  }

  public async execute(): Promise<Array<string | number>> {
    const actualReplies: Array<string | number> =
      await this.userMultiCommand.exec();
    if (!actualReplies.every((v, i) => v === this.expectedReplies[i])) {
      const rollbackMultiCommand = this.rollbacks.reduce((_, curr, i) => {
        return curr(actualReplies[i]);
      }, null);
      await rollbackMultiCommand?.exec();
      throw new GradingQueueServiceError(`The transaction could not be executed successfully. 
      Expected Replies: ${this.expectedReplies} | Actual Replies: ${actualReplies}`);
    }
    return actualReplies;
  }
}

class RedisTransactionBuilder {
  private readonly userMultiCommand: RedisClientMultiCommandType; // RedisClientMultiCommandType
  private readonly rollbackMultiCommand: RedisClientMultiCommandType; // RedisClientMultiCommandType
  private readonly expectedReplies: Array<string | number>;
  private readonly rollbackOperations: Array<RedisRollbackOperation>;

  constructor(client: RedisClientType) {
    if (!client.isOpen) {
      throw new GradingQueueServiceError(
        "Cannot build a transaction with a closed client.",
      );
    }
    this.expectedReplies = [];
    this.userMultiCommand = client.multi();
    this.rollbackMultiCommand = client.multi();
    this.rollbackOperations = [];
  }

  public build(): RedisTransactionExecutor {
    return new RedisTransactionExecutor(
      this.userMultiCommand,
      this.rollbackOperations,
      this.expectedReplies,
    );
  }

  public SET(key: string, value: string, previousValue: string | null) {
    this.userMultiCommand.SET(key, value);
    const expectedReply = "OK";
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      if (previousValue) {
        return this.rollbackMultiCommand.SET(key, previousValue);
      } else {
        return this.rollbackMultiCommand.DEL(key);
      }
    });
    return this;
  }

  public LPUSH(key: string, value: string): RedisTransactionBuilder {
    this.userMultiCommand.LPUSH(key, value);
    // TODO: What if the element was *not* added?
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.LREM(key, 1, value);
    });
    return this;
  }

  public SADD(
    key: string,
    value: string,
    alreadyInSet: boolean,
  ): RedisTransactionBuilder {
    this.userMultiCommand.SADD(key, value);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply || alreadyInSet) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.SREM(key, value);
    });
    return this;
  }

  public SREM(key: string, value: string): RedisTransactionBuilder {
    this.userMultiCommand.SREM(key, value);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.SADD(key, value);
    });
    return this;
  }

  public ZADD(
    key: string,
    score: number,
    value: string,
    previousScore: number | null,
  ): RedisTransactionBuilder {
    this.userMultiCommand.ZADD(key, { score, value });
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      if (previousScore !== null) {
        return this.rollbackMultiCommand.ZADD(key, {
          score: previousScore,
          value,
        });
      } else {
        return this.rollbackMultiCommand.ZREM(key, value);
      }
    });
    return this;
  }

  public ZREM(
    key: string,
    value: string,
    prevScore: number | null,
  ): RedisTransactionBuilder {
    if (prevScore === null) {
      throw new GradingQueueServiceError(
        `While building a transaction, attempted to add a ZREM for a value that is not in the given ZSET ${key}.`,
      );
    }
    this.userMultiCommand.ZREM(key, value);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.ZADD(key, {
        value,
        score: prevScore,
      });
    });
    return this;
  }

  public DEL(
    key: string,
    previousValue: string | null,
  ): RedisTransactionBuilder {
    if (previousValue === null) {
      throw new GradingQueueServiceError(
        `While building a transaction, attempted to add a DEL for a key that does not exist (${key}).`,
      );
    }
    this.userMultiCommand.DEL(key);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.SET(key, previousValue);
    });
    return this;
  }

  public LREM(
    key: string,
    value: string,
    prevPosition: number | null,
  ): RedisTransactionBuilder {
    if (prevPosition === null) {
      throw new GradingQueueServiceError(
        `While building a transaction, attempted to add a LREM for a value that is not in the given LIST ${key}.`,
      );
    }
    this.userMultiCommand.LREM(key, 1, value);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand
        .LPUSH(key, value)
        .LSET(key, prevPosition, value);
    });
    return this;
  }

  public RPUSH(key: string, value: string): RedisTransactionBuilder {
    this.userMultiCommand.RPUSH(key, value);
    const expectedReply = 1;
    this.expectedReplies.push(expectedReply);
    this.rollbackOperations.push((actualReply) => {
      if (actualReply !== expectedReply) {
        return this.rollbackMultiCommand;
      }
      return this.rollbackMultiCommand.LREM(key, -1, value);
    });
    return this;
  }
}
