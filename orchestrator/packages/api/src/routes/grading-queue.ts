import Router from "express";
import {
  getGradingJobs,
  createOrUpdateJob,
  moveJob,
  deleteJob,
  createOrUpdateImmediateJob,
  jobStatus,
} from "../controllers/grading-queue-controller";

const gradingQueueRouter = Router();

// TODO: Add middleware/move existing validation to middleware
gradingQueueRouter.get("/grading_queue", getGradingJobs);
gradingQueueRouter.put("/grading_queue", createOrUpdateJob);
gradingQueueRouter.put("/grading_queue/immediate", createOrUpdateImmediateJob);
gradingQueueRouter.put("/grading_queue/move", moveJob);
gradingQueueRouter.delete("/grading_queue/:jobID", deleteJob);
gradingQueueRouter.post("/grading_queue/job_status", jobStatus);
gradingQueueRouter.get("/grading_queue/:jobID/status", jobStatus);

export default gradingQueueRouter;
