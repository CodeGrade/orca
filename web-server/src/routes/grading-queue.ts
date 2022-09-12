import Router from "express";
import {
  getGradingQueue,
  addGradingJobToQueue,
  moveGradingJobInQueue,
  deleteGradingJobInQueue,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Write handlers/validation and add them to the route handlers
gradingQueueRouter.get("/grading_queue", getGradingQueue);
gradingQueueRouter.post("/grading_queue", addGradingJobToQueue);
gradingQueueRouter.put("/grading_queue/:sub_id", moveGradingJobInQueue);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteGradingJobInQueue);

export default gradingQueueRouter;
