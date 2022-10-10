import Router from "express";
import {
  getGradingQueue,
  createOrUpdateJobController,
  moveJobController,
  deleteJobController,
  createImmediateGradingJobController,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingQueue);
gradingQueueRouter.post("/grading_queue", createOrUpdateJobController);
gradingQueueRouter.post(
  "/grading_queue/immediate",
  createImmediateGradingJobController
);
gradingQueueRouter.put("/grading_queue/move/:sub_id", moveJobController);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteJobController);

export default gradingQueueRouter;
