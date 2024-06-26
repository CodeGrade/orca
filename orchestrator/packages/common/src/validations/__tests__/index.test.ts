import validations from "..";
import { defaultGradingJobConfig } from "../__mocks__/grading-job-config.mock";
import { defaultGraderImageBuildRequest } from "../__mocks__/grader-image-build-request";

describe("JSONSchema validations", () => {
  describe("GradingJobConfig schema validation", () => {
    it("validates a job from a user", () => {
      expect(validations.gradingJobConfig(defaultGradingJobConfig)).toBe(true);
    });

    it("validates a job from a team", () => {
      expect(
        validations.gradingJobConfig({
          ...defaultGradingJobConfig,
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
          ...defaultGradingJobConfig,
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
