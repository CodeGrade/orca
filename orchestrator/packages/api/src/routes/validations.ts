import { Router } from "express";
import verifyAPIKey from "../middleware/verify-api-key";
import { gradingJobValidation } from "../controllers/validations-controller";

const validationsRouter = Router();

validationsRouter.post('/validate_grading_job', verifyAPIKey, gradingJobValidation);

export default validationsRouter;
