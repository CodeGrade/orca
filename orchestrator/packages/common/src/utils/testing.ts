import { GraderImageBuildRequest, GradingJobConfig } from "../types";

export const mockGradingJobConfig: GradingJobConfig = {
  key: "random-key",
  response_url: "https://www.example.com/callback",
  collation: {
    type: "user",
    id: "23",
  },
  files: {
    student: {
      url: "https://www.example.com/submission.zip",
      mime_type: "application/zip",
      should_replace_paths: false
    },
  },
  metadata_table: {
    course_id: "21",
  },
  priority: 10,
  script: [
    {
      cmd: ["echo", "hello"],
      on_complete: "output",
      on_fail: "abort",
    },
  ],
  grader_image_sha: "orca-java-grader",
};

export const mockGraderImageBuildRequest: GraderImageBuildRequest = {
  dockerfile_contents: `FROM hello-world:latest`,
  dockerfile_sha_sum: "generated-sha-sum",
  response_url: "http://example.com/response",
};
