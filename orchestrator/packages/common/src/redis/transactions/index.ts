import { ChainableCommander, Redis } from "ioredis";
import {
  OPERATION_TO_EXPECTED_REPLY,
  OperationsWithRollback,
} from "./expectedReplies";
import {
  RedisTransactionBuilderException,
  RedisTransactionExecutorException,
} from "./exceptions";
import { reduceRight } from "lodash";

// TODO: Should the builder take in a rollback multi command that can be appended
// onto in order to have a single object responsible for all rollback operations?

export type RollbackStep = (
  actualReply: string | number,
  rollbackMultiCommand: ChainableCommander,
) => ChainableCommander;

export type TransactionExecutionResult = [ChainableCommander, Error | null];

export class RedisTransactionExecutor {
  private readonly redisConnection: Redis;
  private readonly transactionMultiCommand: ChainableCommander;
  private readonly expectedReplies: Array<string | number>;
  private readonly rollbackSteps: Array<RollbackStep>;

  constructor(
    redisConnection: Redis,
    transactionMultiCommand: ChainableCommander,
    expectedReplies: Array<string | number>,
    rollbackSteps: Array<RollbackStep>,
  ) {
    if (expectedReplies.length !== rollbackSteps.length) {
      throw new RedisTransactionExecutorException(
        "The given transaction is not valid; the number of expected replies and rollback steps are not equal.",
      );
    }
    this.redisConnection = redisConnection;
    this.transactionMultiCommand = transactionMultiCommand;
    this.expectedReplies = expectedReplies;
    this.rollbackSteps = rollbackSteps;
  }

  public async execute(): Promise<[ChainableCommander, Error | null]> {
    // TODO: Figure out how error (first tuple member) is intended to be used with result.
    const actualReplies = (await this.transactionMultiCommand.exec())?.map(
      ([_, reply]) => reply,
    ) as Array<string | number> | null;
    if (actualReplies === null) {
      throw new RedisTransactionExecutorException(
        "Something went wrong, and executing the multi-command returned null. " +
          "Please ensure the values passed to the transaction steps are valid.",
      );
    }
    // NOTE: reduceRight is used instead of reduce since the rollbacks should occur in the opposite order
    // of the original transaction steps.
    const rollbackMultiCommand: ChainableCommander = reduceRight(
      this.rollbackSteps,
      (prev, curr, i) => {
        curr(actualReplies[i], prev);
        return prev;
      },
      this.redisConnection.multi(),
    );

    return this.expectedReplies.every((r, i) => actualReplies[i] === r)
      ? [rollbackMultiCommand, null]
      : [
          rollbackMultiCommand,
          // TODO: More informative error message. Which operation and what result?
          new RedisTransactionExecutorException(
            "Transaction yielded unexpected results and will need to be rolled back.",
          ),
        ];
  }
}

export class RedisTransactionBuilder {
  private readonly redisConnection: Redis;
  private readonly transactionMultiCommand: ChainableCommander;
  private readonly rollbackSteps: Array<RollbackStep>;
  private readonly expectedReplies: Array<string | number>;
  private readonly buildSteps: Array<() => Promise<void>>;

  constructor(redisConnection: Redis) {
    this.redisConnection = redisConnection;
    this.transactionMultiCommand = redisConnection.multi();
    this.expectedReplies = [];
    this.rollbackSteps = [];
    this.buildSteps = [];
  }

  public async build(): Promise<RedisTransactionExecutor> {
    try {
      await Promise.all(this.buildSteps.map((step) => step()));
      return new RedisTransactionExecutor(
        this.redisConnection,
        this.transactionMultiCommand,
        this.expectedReplies,
        this.rollbackSteps,
      );
    } catch (error) {
      this.transactionMultiCommand.discard();
      throw error;
    }
  }

  public SET(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.set(key, value);
      const previousValue = await this.redisConnection.get(key);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.SET];
      this.expectedReplies.push(expectedReply);
      let rollbackStep: RollbackStep;
      if (previousValue) {
        rollbackStep = (actualReply, rollbackMultiCommand) => {
          return actualReply === expectedReply
            ? rollbackMultiCommand.set(key, previousValue)
            : rollbackMultiCommand;
        };
      } else {
        rollbackStep = (actualReply, rollbackMultiCommand) => {
          return actualReply === expectedReply
            ? rollbackMultiCommand.del(key)
            : rollbackMultiCommand;
        };
      }
      this.rollbackSteps.push(rollbackStep);
    });
    return this;
  }

  public DEL(key: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.del(key);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.DEL];
      this.expectedReplies.push(expectedReply);
      const previousValue = await this.redisConnection.get(key);
      if (!previousValue) {
        throw new RedisTransactionBuilderException(
          `Cannot DELete key ${key} as there is no value for it.`,
        );
      }
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return expectedReply === actualReply
          ? rollbackMultiCommand.set(key, previousValue)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public LPUSH(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.lpush(key, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.LPUSH];
      this.expectedReplies.push(expectedReply);
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand.lrem(key, 1, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public LREM(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.lrem(key, 1, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.LREM];
      this.expectedReplies.push(expectedReply);
      const previousPosition = await this.redisConnection.lpos(key, value);
      if (previousPosition === null) {
        throw new RedisTransactionBuilderException(
          `No element ${value} was found in LIST ${key}.`,
        );
      }
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand
              .lpush(key, value)
              .lset(key, previousPosition, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public RPUSH(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.rpush(key, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.RPUSH];
      this.expectedReplies.push(expectedReply);
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand.lrem(key, 1, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public SADD(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.sadd(key, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.SADD];
      this.expectedReplies.push(expectedReply);
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand.srem(key, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public SREM(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.srem(key, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.SREM];
      this.expectedReplies.push(expectedReply);
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand.sadd(key, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }

  public ZADD(
    key: string,
    value: string,
    score: number,
  ): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.zadd(key, score, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.ZADD];
      this.expectedReplies.push(expectedReply);
      const previousScore = await this.redisConnection.zscore(key, value);
      if (previousScore === null) {
        this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
          return actualReply === expectedReply
            ? rollbackMultiCommand.zrem(key, value)
            : rollbackMultiCommand;
        });
      } else {
        this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
          return actualReply === expectedReply
            ? rollbackMultiCommand.zadd(key, previousScore, value)
            : rollbackMultiCommand;
        });
      }
    });
    return this;
  }

  public ZREM(key: string, value: string): RedisTransactionBuilder {
    this.buildSteps.push(async () => {
      this.transactionMultiCommand.zrem(key, value);
      const expectedReply =
        OPERATION_TO_EXPECTED_REPLY[OperationsWithRollback.ZREM];
      this.expectedReplies.push(expectedReply);
      const previousScore = await this.redisConnection.zscore(key, value);
      if (previousScore === null) {
        throw new RedisTransactionBuilderException(
          `No previous score found for ZSET under key ${key} with member ${value}.`,
        );
      }
      this.rollbackSteps.push((actualReply, rollbackMultiCommand) => {
        return actualReply === expectedReply
          ? rollbackMultiCommand.zadd(key, previousScore, value)
          : rollbackMultiCommand;
      });
    });
    return this;
  }
}

export * from "./exceptions";
export * from "./expectedReplies";
