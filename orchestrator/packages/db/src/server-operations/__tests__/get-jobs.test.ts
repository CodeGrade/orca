import mockPrismaInstance from "../../__mocks__/prisma-instance.mock"
import { generateJobConfigs, generateMultipleMockQueueInfos } from "../../__mocks__/generate-mocks.mock"
import getAllGradingJobs from "../get-jobs";

describe('get all grading jobs in the queue', () => {

  it('returns submitter jobs in order of release at', async () => {
    const configs = generateJobConfigs(2);
    const queueInfos = generateMultipleMockQueueInfos(configs);
    mockPrismaInstance.reservation.findMany.mockResolvedValue(queueInfos.map((q) => ({...q.reservation, submitter: q.submitter})));
    mockPrismaInstance.job.findMany.mockResolvedValue(queueInfos.map((q) => q.job));
    mockPrismaInstance.$transaction.mockImplementation((callback) => callback(mockPrismaInstance));
    await expect(getAllGradingJobs().then((jobs) => jobs.map((j) => j.key))).resolves.toEqual(configs.map((c) => c.key));
  });
  it('returns immediate jobs in order of release at', async () => {});
  it('returns both submitter and immediate jobs in order of release at', async () => {});
  it('', async () => {});

})
