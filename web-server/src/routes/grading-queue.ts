import Router, { Request, Response } from "express";
import getGradingJobs from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import moveGradingJob from "../grading-queue/move";
import deleteGradingJob from "../grading-queue/delete";

const gradingQueueRouter = Router();

// TODO: Typing and Error checking

// TODO: Move methods to controller/respective files
const getGradingJobsHandler = async (req: Request, res: Response) => {
  const grading_jobs = await getGradingJobs();
  res.json(grading_jobs);
};

const addGradingJobToQueue = async (req: Request, res: Response) => {
  const grading_job_config = req.body;
  // TODO: Do something with status
  const status: number = await createGradingJob(grading_job_config);
  res.json(status);
};

// TODO: Figure out if sub_id is a string or number here
const moveGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const new_priority: number = await moveGradingJob(submission_id, req.body);
  res.json(new_priority);
};

const deleteGradingJobInQueue = async (req: Request, res: Response) => {
  const submission_id: string = req.params.sub_id;
  const status: number = await deleteGradingJob(submission_id);
  res.json(status);
};

// TODO: Write handlers/validation and add them to the route handlers
gradingQueueRouter.get("/grading_queue", getGradingJobsHandler);
gradingQueueRouter.post("/grading_queue", addGradingJobToQueue);
gradingQueueRouter.put("/grading_queue/:sub_id", moveGradingJobInQueue);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteGradingJobInQueue);

export default gradingQueueRouter;
