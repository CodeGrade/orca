import Ajv from "ajv";
import { collationSchema } from "./schemas/shared";
import {
  GradingJobConfig,
  gradingJobConfigSchema,
} from "./schemas/grading-job-config";
import {
  DeleteJobRequest,
  deleteJobRequestSchema,
} from "./schemas/delete-job-request";
import {
  MoveJobRequest,
  moveJobRequestSchema,
} from "./schemas/move-job-request";

const ajv = new Ajv().addSchema(collationSchema);

const validations = {
  gradingJobConfig: ajv.compile<GradingJobConfig>(gradingJobConfigSchema),
  deleteJobRequestSchema: ajv.compile<DeleteJobRequest>(deleteJobRequestSchema),
  moveJobRequestSchema: ajv.compile<MoveJobRequest>(moveJobRequestSchema),
};

export default validations;
