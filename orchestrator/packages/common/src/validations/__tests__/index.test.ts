import validations from "..";
import { mockGraderImageBuildRequest, mockGradingJobConfig } from "../../utils/testing";

describe("JSONSchema validations", () => {
  describe("GradingJobConfig schema validation", () => {
    it("validates a job from a user", () => {
      expect(validations.gradingJobConfig(mockGradingJobConfig)).toBe(true);
    });

    it("validates a job from a team", () => {
      expect(
        validations.gradingJobConfig({
          ...mockGradingJobConfig,
          collation: {
            type: "team",
            id: "123456",
          },
        }),
      ).toBe(true);
    });

    it("returns false on missing arguments", () => {
      const keys = Object.keys(mockGradingJobConfig);
      keys.forEach((k) => {
        const config = {...mockGradingJobConfig};
        delete (config as Record<string, any>)[k]
        expect(validations.gradingJobConfig(config)).toBe(false);
      });
    });

    it("validates a job with a container response url", () => {
      expect(
        validations.gradingJobConfig({
          ...mockGradingJobConfig,
          container_response_url: "https://example.com/response",
        }),
      ).toBe(true);
    });
  });

  describe("GraderImageBuildRequest schema validation", () => {
    it("validates a request with contents and SHA sum of a dockerfile", () => {
      expect(
        validations.graderImageBuildRequest(mockGraderImageBuildRequest),
      ).toBe(true);
    });

    it("returns false on validation if any properties are missing", () => {
      const keys = Object.keys(mockGraderImageBuildRequest);
      keys.forEach((k) => {
        const req = {...mockGraderImageBuildRequest};
        delete (req as Record<string, any>)[k]
        expect(validations.graderImageBuildRequest(req)).toBe(false);
      });
    });
  });
});
