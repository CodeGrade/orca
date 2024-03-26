import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prismaInstance from '../prisma-instance';
import { PrismaClient } from '@prisma/client';

jest.mock('../prisma-instance', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(mockPrismaInstance);
});


const mockPrismaInstance = prismaInstance as unknown as DeepMockProxy<PrismaClient>;
export default mockPrismaInstance;

