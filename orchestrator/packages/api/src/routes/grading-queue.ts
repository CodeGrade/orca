import Router from "express";
import {
  getGradingJobs,
  createOrUpdateJob,
  moveJob,
  deleteJob,
  createOrUpdateImmediateJob,
  jobStatus,
} from "../controllers/grading-queue-controller";
import verifyAPIKey from "../middleware/verify-api-key";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingJobs);
gradingQueueRouter.put("/grading_queue", verifyAPIKey, createOrUpdateJob);
gradingQueueRouter.put("/grading_queue/immediate", verifyAPIKey, createOrUpdateImmediateJob);
gradingQueueRouter.put("/grading_queue/move", verifyAPIKey, moveJob);
gradingQueueRouter.delete("/grading_queue/:jobID", verifyAPIKey, deleteJob);
gradingQueueRouter.get("/grading_queue/:jobID/status", jobStatus);

export default gradingQueueRouter;
