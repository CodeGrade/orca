import validations from "..";
import { defaultGraderImageBuildRequest, mockGradingJobConfig } from "../../utils/testing";

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
        validations.graderImageBuildRequest(defaultGraderImageBuildRequest),
      ).toBe(true);
    });
  });
});
