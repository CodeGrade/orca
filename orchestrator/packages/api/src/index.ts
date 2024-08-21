import { Express } from "express";
import gradingQueueRouter from "./routes/grading-queue";
import { existsSync, mkdirSync } from "fs";
import { getConfig, logger } from "@codegrade-orca/common";
import express = require("express");
import cors = require("cors");
import dockerImagesRouter from "./routes/docker-images";
import holdingPenRouter from "./routes/holding-pen";
import { getNumJobsEnqueued } from "@codegrade-orca/db";

const CONFIG = getConfig();

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1", gradingQueueRouter, dockerImagesRouter, holdingPenRouter);
app.use("/status", async (_req, res) => res.json({"message": "ok", "numJobs": await getNumJobsEnqueued()}));
app.use("/images", express.static(CONFIG.dockerImageFolder));
app.use("/", async(_req, res) => res.send('<h1>Orca Web API</h1>'));

app.listen(CONFIG.api.port, () => {
  if (!existsSync(CONFIG.dockerImageFolder)) {
    mkdirSync(CONFIG.dockerImageFolder);
  }
  logger.info(`Server listening on port ${CONFIG.api.port}`);
});
