import { closeSync, openSync, rmSync, statSync } from "fs";
import { TouchGraderImageFileError, touchGraderImageFile } from "../grader-images";
import { getConfig, mockGradingJobConfig } from "@codegrade-orca/common";
import path from "path";


describe("Grader image api utils", () => {
  const CONFIG = getConfig();
  const testSHASum = 'grader-image-sha-sum';
  const tgzTestPath = path.join(CONFIG.dockerImageFolder, `${testSHASum}.tgz`);

  beforeAll(() => {
    const tgzTestFP = openSync(tgzTestPath, 'w');
    closeSync(tgzTestFP);
  });

  afterAll(() => {
    rmSync(tgzTestPath);
  });

  it('throws and error when the grader image file doesn\'t exist', async () => {
    const testJobConfig = { ...mockGradingJobConfig, grader_image_sha: "non-existent-sha-sum"};
    expect(() => touchGraderImageFile(testJobConfig)).rejects.toThrow(TouchGraderImageFileError);
  });

  it('touches the file successfully when it does exist', async () => {
    const testJobConfig = { ...mockGradingJobConfig, grader_image_sha: testSHASum };
    const { mtimeMs: mtimeBefore } = statSync(tgzTestPath);
    await touchGraderImageFile(testJobConfig);
    const { mtimeMs: mtimeAfter } = statSync(tgzTestPath);
    expect(mtimeAfter).toBeGreaterThan(mtimeBefore);
  });
});

