import axios, { AxiosResponse } from "axios";
import { GradingScriptCommand } from "../components/grading_job_table/types";
import { DeleteJobRequest, GetJobsParams, MoveJobRequest } from "./types";
// TODO: Environment variable
const API_BASE = "http://localhost:4000/api/v1/grading_queue";

export const getGradingJobs = async (getJobParams: GetJobsParams) => {
  const response: AxiosResponse = await axios.get(API_BASE, {
    params: getJobParams,
  });
  return response.data;
};

export const deleteJob = async (deleteJobRequest: DeleteJobRequest) => {
  const response = await axios.delete(`${API_BASE}`, {
    data: { deleteJobRequest },
  });
  return response.data;
};

export const moveJob = async (moveJobRequest: MoveJobRequest) => {
  const response = await axios.put(`${API_BASE}/move`, {
    moveJobRequest,
  });
  return response;
};

// TODO: Move to testing directory/file
/* ===== TEST ===== */
interface CodeFileInfo {
  url: string;
  mime_type: string;
}
enum CollationType {
  User = "user",
  Team = "team",
}
interface Collation {
  type: CollationType;
  id: string;
}
export interface GradingJobConfig {
  key: string; // JSONString
  collation: Collation;
  metadata_table: {
    // Map<string, string | string[]>;
    [key: string]: string;
  };
  files: {
    // Map<string, CodeFileInfo>;
    [type: string]: CodeFileInfo;
  };
  priority: number;
  script: GradingScriptCommand[];
  response_url: string;
}

const createOrUpdateGradingJob = async (gradingJobConfig: GradingJobConfig) => {
  const response = await axios.post(`${API_BASE}`, gradingJobConfig);
  return response;
};

export const createOrUpdateXGradingJobs = async (numJobs: number) => {
  const generateCourseId = (i: number): string =>
    `${i}${i}${i}${i}`.substring(0, 4);

  const generateGraderId = (i: number): string =>
    `${i}${i}${i}${i}`.substring(0, 3);

  const generateGraderDescription = (): string => {
    const graderDescriptions = ["JUnit Grader", "Auto", "Manual"];
    return graderDescriptions[
      Math.floor(Math.random() * graderDescriptions.length)
    ];
  };

  const responses = [];
  for (let i = 1; i < numJobs + 1; i++) {
    const courseId = i < numJobs / 2 ? "1111" : "2222";
    const gradingJobConfig: GradingJobConfig = {
      key: `key${i}`,
      collation: {
        type: CollationType.User,
        id: `${100 + i}`,
      },
      files: {
        student_code: {
          url: `https://handins.ccs.neu.edu/files/submission${i}.zip`,
          mime_type: "application/zip",
        },
        starter_code: {
          url: `https://handins.ccs.neu.edu/files/starter.zip`,
          mime_type: "application/zip",
        },
      },
      priority: Math.min(300000, (i + 1) * 60000), // 5 mins or i + 1 in minutes
      metadata_table: {
        assignment_name: `Assignment ${i}`,
        grader_description: generateGraderDescription(),
        grader_id: generateGraderId(i),
        course_id: courseId, // generateCourseId(i),
        submitter_name: `user${100 + i}`,
      },
      script: [
        { cmd: "ls", on_fail: 0, on_complete: 1 },
        { cmd: "pwd", on_fail: 0, on_complete: 2 },
        { cmd: "echo 'hello'", on_fail: "abort", on_complete: "output" },
      ],
      response_url: "https://handins.ccs.neu.edu",
    };
    const response = await createOrUpdateGradingJob(gradingJobConfig);
    responses.push(response);
  }
  return responses;
};
