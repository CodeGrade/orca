import { Express } from "express";
import gradingQueueRouter from "./routes/grading-queue";
import { existsSync, mkdirSync } from "fs";
import { getConfig, logger } from "@codegrade-orca/common";
import express = require("express");
import cors = require("cors");
import dockerImagesRouter from "./routes/docker-images";
import holdingPenRouter from "./routes/holding-pen";

const CONFIG = getConfig();

const app: Express = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", gradingQueueRouter, dockerImagesRouter, holdingPenRouter);
app.use("/status", (_req, res) => res.json({"message": "ok"}));
app.use("/images", express.static(CONFIG.dockerImageFolder));

app.listen(PORT, () => {
  if (!existsSync(CONFIG.dockerImageFolder)) {
    mkdirSync(CONFIG.dockerImageFolder);
  }
  logger.info(`Server listening on port ${PORT}`);
});
