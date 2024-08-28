import { Router } from "express";
import verifyAPIKey from "../middleware/verify-api-key";
import { gradingJobValidation, gradingScriptValidation } from "../controllers/validations-controller";

const validationsRouter = Router();

validationsRouter.post('/validate_grading_job', verifyAPIKey, gradingJobValidation);
validationsRouter.post('/validate_grading_script', verifyAPIKey, gradingScriptValidation);

export default validationsRouter;
