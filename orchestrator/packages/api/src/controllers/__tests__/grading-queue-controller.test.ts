import { createOrUpdateJob, createOrUpdateImmediateJob  } from '../grading-queue-controller';
import { Request, Response } from 'express';
import { errorResponse } from '../utils';
import { mockGradingJobConfig, validations } from '@codegrade-orca/common';


jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  errorResponse: jest.fn()
}));

describe('job creation controller functions', () => {
  it.each([createOrUpdateJob, createOrUpdateImmediateJob])(
    'should throw a 400 with errors when %p is given an invalid request',
    async (controllerFunc) => {
      const { files: _files, ...rest } = mockGradingJobConfig;
      const validator = validations.gradingJobConfig;
      validator(rest);
      expect(validator.errors).toBeDefined();
      expect(validator.errors!.length).toBeGreaterThan(0);
      const [mockReq, mockRes] = [{ body: rest } as Request, {} as Response];
      await controllerFunc(mockReq, mockRes);
      // Add one to length of array for hardcoded error string.
      expect(errorResponse).toHaveBeenCalledWith(mockRes, 400, Array(validator.errors!.length + 1).fill(expect.anything()));
    }
  )
});
