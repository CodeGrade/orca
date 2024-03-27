import mockPrismaInstance from "../../__mocks__/prisma-instance.mock"
import { generateJobConfigs, generateMockQueueInfo, generateMultipleMockQueueInfos } from "../../__mocks__/generate-mocks.mock"
import getAllGradingJobs from "../get-jobs";

describe('get all grading jobs in the queue', () => {

  beforeEach(() => {
    mockPrismaInstance.$transaction.mockImplementation((callback) => callback(mockPrismaInstance));
  });

  it('returns submitter jobs in order of release at', async () => {
    const configs = generateJobConfigs(2);
    const queueInfos = generateMultipleMockQueueInfos(configs);
    mockPrismaInstance.reservation.findMany.mockResolvedValue(queueInfos.map((q) => ({ ...q.reservation, submitter: q.submitter })));
    mockPrismaInstance.job.findMany.mockResolvedValue(queueInfos.map((q) => q.job));
    await expect(getAllGradingJobs().then((jobs) => jobs.map((j) => j.key))).resolves.toEqual(configs.map((c) => c.key));
  });
  it('returns immediate jobs in order of release at', async () => {
    const configs = generateJobConfigs(2);
    const queueInfos = generateMultipleMockQueueInfos(configs, true);
    mockPrismaInstance.reservation.findMany.mockResolvedValue(queueInfos.map((q) => ({ ...q.reservation, job: q.job })));
    mockPrismaInstance.job.findMany.mockResolvedValue(queueInfos.map((q) => q.job));
    await expect(getAllGradingJobs().then((jobs) => jobs.map((j) => j.key))).resolves.toEqual(configs.map((c) => c.key));
  });
  it('returns both submitter and immediate jobs in order of release at', async () => {
    const configs = generateJobConfigs(4);
    const queueInfos = configs.map((c, i) => generateMockQueueInfo(c, i % 2 !== 0, i));
    const expectedOrder = [0, 1, 3, 2].map((idNum) => idNum.toString());
    mockPrismaInstance.reservation.findMany.mockResolvedValue(
      queueInfos.map((q) => ({ ...q.reservation, ...!q.submitter && { job: q.job } }))
        .sort((r1, r2) => r1.releaseAt.getTime() - r2.releaseAt.getTime())
    );
    mockPrismaInstance.job.findMany.mockResolvedValue(queueInfos.filter((q) => q.submitter).map((q) => q.job));
    await expect(getAllGradingJobs().then((jobs) => jobs.map((j) => j.key))).resolves.toEqual(expectedOrder);
  });
})
