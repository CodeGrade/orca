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
import { DockerImageBuildRequest } from "../docker-images/types";
import { dockerImageBuildRequestSchema } from "./schemas/docker-image-build-request";

let ajv = new Ajv().addSchema(collationSchema);
ajv = gradingJobConfigSubSchemas.reduce(
  (prev, curr) => prev.addSchema(curr),
  ajv,
);

const validations = {
  gradingJobConfig: ajv.compile<GradingJobConfig>(gradingJobConfigSchema),
  deleteJobRequest: ajv.compile<DeleteJobRequest>(deleteJobRequestSchema),
  moveJobRequest: ajv.compile<MoveJobRequest>(moveJobRequestSchema),
  dockerImageBuildRequest: ajv.compile<DockerImageBuildRequest>(
    dockerImageBuildRequestSchema,
  ),
};

export default validations;
