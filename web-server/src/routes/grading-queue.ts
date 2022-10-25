import Router from "express";
import {
  getGradingJobs,
  createOrUpdateJob,
  moveJob,
  deleteJobController,
  createOrUpdateImmediateJob,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingJobs);
gradingQueueRouter.post("/grading_queue", createOrUpdateJob);
gradingQueueRouter.post("/grading_queue/immediate", createOrUpdateImmediateJob);
gradingQueueRouter.put("/grading_queue/move/:sub_id", moveJob);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteJobController);

export default gradingQueueRouter;
