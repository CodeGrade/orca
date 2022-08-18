import Router, { Request, Response } from "express";
import { client } from "../index";
import getGradingQueue from "../grading-queue/get";
import createGradingJob from "../grading-queue/create";
import moveGradingJob from "../grading-queue/move";
import deleteGradingJob from "../grading-queue/delete";

const gradingQueueRouter = Router();

// TODO: Error checking

// TODO: Move methods to controller/respective files
const getGradingQueueHandler = async (req: Request, res: Response) => {
  const grading_jobs = await getGradingQueue();
  res.json(grading_jobs);
};

const addGradingJobToQueue = async (req: Request, res: Response) => {
  const grading_job_config = req.body;
  // TODO: Do something with status
  const status = await createGradingJob(grading_job_config);
  res.json(status);
};

// TODO: Figure out if sub_id is a string or number here
const moveGradingJobInQueue = async (req: Request, res: Response) => {
  const sub_id_to_move: string = req.params.sub_id;
  const new_priority: number = await moveGradingJob(sub_id_to_move, req.body);
  res.json(new_priority);
};

const deleteGradingJobInQueue = async (req: Request, res: Response) => {
  const sub_id_to_delete = req.params.sub_id;
  const status = await deleteGradingJob(sub_id_to_delete);
  res.json(status);
};

// TODO: Abstract handlers and add them to the route handlers
gradingQueueRouter.get("/grading_queue", getGradingQueueHandler);
gradingQueueRouter.post("/grading_queue", addGradingJobToQueue);
gradingQueueRouter.put("/grading_queue/:sub_id", moveGradingJobInQueue);
gradingQueueRouter.delete("/grading_queue/:sub_id", deleteGradingJobInQueue);

export default gradingQueueRouter;
