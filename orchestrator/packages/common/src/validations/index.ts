import Ajv from "ajv";
import { collationSchema } from "./schemas/shared";
import {
  gradingJobConfigSchema,
  gradingJobConfigSubSchemas,
} from "./schemas/grading-job-config";
import { moveJobRequestSchema } from "./schemas/move-job-request";
import {
  GradingJobConfig,
  MoveJobRequest,
} from "../types/grading-queue";
import { GraderImageBuildRequest } from "../types/image-build-service";
import { graderImageBuildRequestSchema } from "./schemas/grader-image-build-request";

let ajv = new Ajv().addSchema(collationSchema);
ajv = gradingJobConfigSubSchemas.reduce(
  (prev, curr) => prev.addSchema(curr),
  ajv,
);

export default {
  gradingJobConfig: ajv.compile<GradingJobConfig>(gradingJobConfigSchema),
  moveJobRequest: ajv.compile<MoveJobRequest>(moveJobRequestSchema),
  graderImageBuildRequest: ajv.compile<GraderImageBuildRequest>(
    graderImageBuildRequestSchema,
  ),
};
