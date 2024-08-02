import { Router } from "express";
import { holdingPenStatus } from "../controllers/holding-pen-controller";

const holdingPenRouter = Router();

holdingPenRouter.get("/holding_pen/:jobConfigID/status", holdingPenStatus);

export default holdingPenRouter;
