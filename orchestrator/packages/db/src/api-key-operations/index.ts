import { randomBytes } from 'crypto';
import prismaInstance from '../prisma-instance';

const KEY_LENGTH = 64;

export const createAPIKey = async (hostname: string): Promise<string> =>
  await prismaInstance.$transaction(async (tx) => {
    const key = generateKey();
    await tx.apiKey.create({
      data: {
        hostname,
        value: key
      }
    });
    return key;
  });

export const validAPIKey = async (hostname: string, value: string) =>
  Boolean(await prismaInstance.apiKey.count({ where: { hostname, value } }))

// randomBytes into hex string will return a value with double the length passed
// to randomBytes
const generateKey = (): string => randomBytes(KEY_LENGTH / 2).toString('hex');
