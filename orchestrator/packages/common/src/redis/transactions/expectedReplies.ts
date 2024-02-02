export enum OperationsWithRollback {
  SET = "SET",
  DEL = "DEL",
  LPUSH = "LPUSH",
  LREM = "LREM",
  RPUSH = "RPUSH",
  SADD = "SADD",
  SREM = "SREM",
  ZADD = "ZADD",
  ZREM = "ZREM",
}

export const OPERATION_TO_EXPECTED_REPLY: Record<
  OperationsWithRollback,
  string | number
> = {
  [OperationsWithRollback.SET]: "OK",
  [OperationsWithRollback.DEL]: 1,
  [OperationsWithRollback.LPUSH]: 1,
  [OperationsWithRollback.LREM]: 1,
  [OperationsWithRollback.RPUSH]: 1,
  [OperationsWithRollback.SADD]: 1,
  [OperationsWithRollback.SREM]: 1,
  [OperationsWithRollback.ZADD]: 1,
  [OperationsWithRollback.ZREM]: 1,
};
