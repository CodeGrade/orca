import Router from "express";
import {
  getGradingQueue,
  addStudentGradingJobToQueue,
  moveGradingJobInQueue,
  deleteGradingJobInQueue,
  addProfessorGradingJobToQueue,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingQueue);
gradingQueueRouter.post("/grading_queue", addStudentGradingJobToQueue);
gradingQueueRouter.post(
  "/grading_queue/immediate",
  addProfessorGradingJobToQueue
);
gradingQueueRouter.put("/grading_queue/move/:sub_id", moveGradingJobInQueue);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteGradingJobInQueue);

export default gradingQueueRouter;
