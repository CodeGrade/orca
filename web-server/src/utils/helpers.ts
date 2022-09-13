import { client } from "../index";

export const redisSet = async (key: string, value: any) => {
  try {
    return [await client.set(key, value), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisGet = async (key: string) => {
  try {
    return [await client.get(key), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisExpireTime = async (key: string) => {
  try {
    return [await client.expireTime(key), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisExpireAt = async (key: string, expire_at: number) => {
  try {
    return [await client.expireAt(key, expire_at), null];
  } catch (error) {
    return [null, error];
  }
};

export const redisZAdd = async (key: string, score: number, value: string) => {
  try {
    return [await client.zAdd(key, [{ score: score, value: value }]), null];
  } catch (error) {
    return [null, error];
  }
};
