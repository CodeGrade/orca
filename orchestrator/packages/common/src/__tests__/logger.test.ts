import path from 'path';
import { OrchestratorConfig } from '../config';
import { existsSync, rmSync } from 'fs';

const logsDirForTesting = path.join(__dirname, 'logs');
const mockConfig: OrchestratorConfig = {
  postgresURL: 'url',
  environment: 'development',
  dockerImageFolder: 'dir',
  orchestratorLogsDir: logsDirForTesting,
  api: {}
};
jest.mock('../config', () => ({
  getConfig: jest.fn().mockReturnValue(mockConfig)
}));
jest.mock('pino');

beforeAll(() => {
  expect(existsSync(logsDirForTesting)).toBe(false);
});

afterAll(() => {
  if (existsSync(logsDirForTesting)) {
    rmSync(logsDirForTesting, { recursive: true, force: true });
  }
});

describe('orchestrator logger', () => {
  it("creates a directory upon being used", () => {
    import('../logger').then(({ default: _logger }) => {
      expect(existsSync(logsDirForTesting)).toBe(true);
    });
  });
});
