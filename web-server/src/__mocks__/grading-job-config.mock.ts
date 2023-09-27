import { GradingJobConfig } from "../grading-queue/types";

export const defaultGradingJobConfig: GradingJobConfig = {
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
};
