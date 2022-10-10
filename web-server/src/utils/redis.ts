import { client } from "../index";

export const redisSet = async (
  key: string,
  value: any
): Promise<[string | null, Error | null]> => {
  try {
    // "OK" or null
    return [await client.set(key, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisGet = async (
  key: string
): Promise<[string | null, Error | null]> => {
  try {
    // key value or null
    return [await client.get(key), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisExpireTime = async (
  key: string
): Promise<[number | null, Error | null]> => {
  try {
    // expiration value or -1 or -2
    return [await client.expireTime(key), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisExpireAt = async (
  key: string,
  expire_at: number
): Promise<[boolean | null, Error | null]> => {
  try {
    // 0 or 1
    return [await client.expireAt(key, expire_at), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisZAdd = async (
  key: string,
  score: number,
  value: string
): Promise<[number | null, Error | null]> => {
  try {
    // number of values added (1)
    return [await client.zAdd(key, [{ score: score, value: value }]), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLPush = async (
  key: string,
  value: any
): Promise<[number | null, Error | null]> => {
  try {
    // number of values added (1)
    return [await client.lPush(key, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisRPush = async (
  key: string,
  value: any
): Promise<[number | null, Error | null]> => {
  try {
    // number of values added (1)
    return [await client.rPush(key, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLInsertAfter = async (
  key: string,
  pivot: any,
  value: any
): Promise<[number | null, Error | null]> => {
  try {
    // new length of list or -1 if pivot not found
    return [await client.lInsert(key, "AFTER", pivot, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLInsertBefore = async (
  key: string,
  pivot: any,
  value: any
): Promise<[number | null, Error | null]> => {
  try {
    // new length of list or -1 if pivot not found
    return [await client.lInsert(key, "BEFORE", pivot, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisZRangeWithScores = async (
  key: string,
  start: number,
  stop: number
) => {
  try {
    // zset values or []
    return [await client.zRangeWithScores(key, start, stop), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLRange = async (
  key: string,
  start: number,
  stop: number
): Promise<[string[] | null, Error | null]> => {
  try {
    // lrange values or []
    return [await client.lRange(key, start, stop), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLRem = async (
  key: string,
  element: string,
  count: number = 1
): Promise<[number | null, Error | null]> => {
  try {
    // Number of elements deleted
    return [await client.lRem(key, count, element), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisLIndex = async (
  key: string,
  index: number
): Promise<[string | null, Error | null]> => {
  try {
    // element at index or null
    const element = await client.lIndex(key, index);
    if (!element)
      return [null, Error("Element not found at given index during LINDEX.")];
    return [element, null];
  } catch (error) {
    return [null, error];
  }
};

export const redisZScore = async (
  key: string,
  member: string
): Promise<[number | null, Error | null]> => {
  try {
    const score = await client.zScore(key, member);
    if (!score)
      return [null, Error("Key or Member not found when getting ZScore")];
    return [score, null];
  } catch (error) {
    return [null, error];
  }
};

export const redisKeys = async (
  pattern: string
): Promise<[string[] | null, Error | null]> => {
  try {
    // list of keys (strings) or empty list
    const keys: string[] = await client.keys(pattern);
    return [keys, null];
  } catch (error) {
    return [null, error];
  }
};
