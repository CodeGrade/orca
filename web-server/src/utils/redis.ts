import { client } from "../index";

// TODO: Use these everywhere?
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
