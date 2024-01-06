import express, { Express } from "express";
import cors from "cors";
import gradingQueueRouter from "./routes/grading-queue";
import path from "path";
import { mkdirSync } from "fs";
import { DOCKER_IMAGE_FILE_LOCATION } from "./grader-images";

const app: Express = express();
export const STATIC_FILE_DIRECTORY = path.join(__dirname, "../", "files");
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", gradingQueueRouter);
app.use("/files", express.static(STATIC_FILE_DIRECTORY));
app.use("/images", express.static(DOCKER_IMAGE_FILE_LOCATION));

app.listen(PORT, () => {
  mkdirSync(DOCKER_IMAGE_FILE_LOCATION);
  console.info(`Server listening on port ${PORT}`);
});
