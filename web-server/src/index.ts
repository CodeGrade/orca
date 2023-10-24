import express, { Express } from "express";
import cors from "cors";
import { createClient, RedisClientType } from "redis";
import gradingQueueRouter from "./routes/grading-queue";
import path from "path";

const app: Express = express();
export const STATIC_FILE_DIRECTORY = path.join(__dirname, "../", "files");
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", gradingQueueRouter);
app.use("/files", express.static(STATIC_FILE_DIRECTORY));

app.listen(PORT, () => {
  console.info(`Server listening on port ${PORT}`);
});
