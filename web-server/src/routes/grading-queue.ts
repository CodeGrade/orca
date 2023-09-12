import Router from "express";
import {
  getGradingJobs,
  createOrUpdateJob,
  moveJob,
  deleteJob,
  createOrUpdateImmediateJob,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingJobs);
gradingQueueRouter.put("/grading_queue", createOrUpdateJob);
gradingQueueRouter.put("/grading_queue/immediate", createOrUpdateImmediateJob);
gradingQueueRouter.put("/grading_queue/move", moveJob);
gradingQueueRouter.delete("/grading_queue", deleteJob);

export default gradingQueueRouter;
