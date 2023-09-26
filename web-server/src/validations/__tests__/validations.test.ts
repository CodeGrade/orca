import validations from "..";
import {
  validDeleteRequest,
  validImmediateDeleteRequest,
} from "../__mocks__/delete-request.mock";
import { validGradingJobConfig } from "../__mocks__/grading-job-config.mock";

describe("JSONSchema validations", () => {
  describe("GradingJobConfig schema validation", () => {
    it("validates a job from a user", () => {
      expect(validations.gradingJobConfig(validGradingJobConfig)).toBe(true);
    });

    it("validates a job from a team", () => {
      expect(
        validations.gradingJobConfig({
          ...validGradingJobConfig,
          collation: {
            type: "team",
            id: "123456",
          },
        }),
      ).toBe(true);
    });
  });

  describe("DeleteJobRequest schema validation", () => {
    it("validates a request with a key, nonce, and user collation", () => {
      expect(validations.deleteJobRequest(validDeleteRequest)).toBe(true);
    });

    it("validates a request with a key, nonce, and team collation", () => {
      expect(
        validations.deleteJobRequest({
          ...validDeleteRequest,
          collation: {
            type: "team",
            id: "12345",
          },
        }),
      );
    });

    it("validates a request with only a key", () => {
      expect(validations.deleteJobRequest(validImmediateDeleteRequest)).toBe(
        true,
      );
    });
  });
});
