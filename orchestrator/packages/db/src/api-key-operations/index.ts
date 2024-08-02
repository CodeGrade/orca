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

const generateKey = (): string => [...Array(KEY_LENGTH)].map((_) => Math.floor(Math.random() * 16).toString(16)).join('');
