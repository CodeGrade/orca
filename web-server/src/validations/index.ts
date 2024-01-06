import Ajv from "ajv";
import { collationSchema } from "./schemas/shared";
import {
  gradingJobConfigSchema,
  gradingJobConfigSubSchemas,
} from "./schemas/grading-job-config";
import { deleteJobRequestSchema } from "./schemas/delete-job-request";
import { moveJobRequestSchema } from "./schemas/move-job-request";
import {
  DeleteJobRequest,
  GradingJobConfig,
  MoveJobRequest,
} from "../grading-queue/types";
import { GraderImageBuildRequest } from "../grader-images/types";
import { graderImageBuildRequestSchema } from "./schemas/grader-image-build-request";

let ajv = new Ajv().addSchema(collationSchema);
ajv = gradingJobConfigSubSchemas.reduce(
  (prev, curr) => prev.addSchema(curr),
  ajv,
);

const validations = {
  gradingJobConfig: ajv.compile<GradingJobConfig>(gradingJobConfigSchema),
  deleteJobRequest: ajv.compile<DeleteJobRequest>(deleteJobRequestSchema),
  moveJobRequest: ajv.compile<MoveJobRequest>(moveJobRequestSchema),
  graderImageBuildRequest: ajv.compile<GraderImageBuildRequest>(
    graderImageBuildRequestSchema,
  ),
};

export default validations;
